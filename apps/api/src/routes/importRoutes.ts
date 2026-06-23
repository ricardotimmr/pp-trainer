import { createHash } from 'node:crypto';
import { extname } from 'node:path';

import { ActivityJsonImportRequestSchema, type ImportResultDto } from '@pp-trainer/shared';
import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import { ApiError } from '../errors/ApiError.js';
import { getApiConfig } from '../config/env.js';
import { writeImportFile } from '../lib/fileStorage.js';
import { DTO_TO_PRISMA_IMPORT_STATUS_MAP } from '../mappers/enumMaps.js';
import * as ImportedFileRepository from '../repositories/ImportedFileRepository.js';
import * as ImportJobService from '../services/ImportJobService.js';

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  if (value !== null && typeof value === 'object') {
    const sorted = Object.keys(value as object)
      .sort()
      .map((k) => `"${k}":${canonicalJson((value as Record<string, unknown>)[k])}`);
    return '{' + sorted.join(',') + '}';
  }
  return JSON.stringify(value);
}
import { runImportPipeline } from '../import/pipeline/runImportPipeline.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as ImportService from '../services/ImportService.js';

import type { DataSourceType, ImportedFileType, RawDataFormat } from '@prisma/client';

const ALLOWED_EXTENSIONS = ['.fit', '.gpx', '.tcx'] as const;
type AllowedExt = (typeof ALLOWED_EXTENSIONS)[number];

const EXT_SOURCE_MAP: Record<AllowedExt, DataSourceType> = {
  '.fit': 'ManualFitUpload',
  '.gpx': 'ManualGpxUpload',
  '.tcx': 'ManualTcxUpload',
};

const EXT_FILE_TYPE_MAP: Record<AllowedExt, ImportedFileType> = {
  '.fit': 'Fit',
  '.gpx': 'Gpx',
  '.tcx': 'Tcx',
};

const EXT_RAW_FORMAT_MAP: Record<AllowedExt, RawDataFormat> = {
  '.fit': 'Fit',
  '.gpx': 'Gpx',
  '.tcx': 'Tcx',
};

const NOT_IMPLEMENTED_BODY = {
  error: {
    code: 'NOT_IMPLEMENTED',
    message:
      'File upload and parsing are not supported in Phase 3. Activity import will be implemented in Phase 4.',
  },
} as const;

export async function importRoutes(app: FastifyInstance): Promise<void> {
  // Phase 3 placeholder — kept for backwards compatibility
  app.get('/api/import/history', async () => {
    return ImportService.getImportHistory();
  });

  // Phase 3 placeholder — superseded by /api/imports/activity-file below
  app.post('/api/import/upload', async (_request, reply) => {
    return reply.status(501).send(NOT_IMPLEMENTED_BODY);
  });

  // ── Phase 4 ──────────────────────────────────────────────────────────────────

  app.get('/api/imports', async (request) => {
    const query = request.query as {
      status?: string;
      limit?: string;
      offset?: string;
    };

    const status =
      query.status != null && query.status in DTO_TO_PRISMA_IMPORT_STATUS_MAP
        ? DTO_TO_PRISMA_IMPORT_STATUS_MAP[query.status as keyof typeof DTO_TO_PRISMA_IMPORT_STATUS_MAP]
        : undefined;

    const limit = query.limit != null ? Math.min(parseInt(query.limit, 10) || 20, 100) : 20;
    const offset = query.offset != null ? parseInt(query.offset, 10) || 0 : 0;

    return ImportJobService.getImports({ status, limit, offset });
  });

  app.get('/api/imports/:id', async (request) => {
    const { id } = request.params as { id: string };
    return ImportJobService.getImportById(id);
  });

  app.post('/api/imports/activity-json', async (request, reply) => {
    let body: unknown = request.body;

    try {
      body = ActivityJsonImportRequestSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
          },
        });
      }
      throw err;
    }

    const parsed = body as ReturnType<typeof ActivityJsonImportRequestSchema.parse>;

    // Single-user guard — MVP: must match the seeded profile
    const profile = await AthleteRepository.findFirstAthleteProfile();
    if (profile == null) {
      throw ApiError.notFound('No athlete profile found');
    }
    if (parsed.athleteProfileId !== profile.id) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'athleteProfileId does not match the active profile',
        },
      });
    }

    // Canonical JSON (sorted keys, no whitespace) — excludes forceImport so the
    // hash represents only the activity content regardless of the bypass flag
    const { forceImport, ...activityFields } = parsed;
    const rawPayloadHash = createHash('sha256')
      .update(canonicalJson(activityFields))
      .digest('hex');

    const result = await runImportPipeline({
      athleteProfileId: profile.id,
      source: 'ManualJsonImport',
      input: parsed,
      rawPayloadHash,
      forceImport: forceImport === true,
    });

    const dto: ImportResultDto = {
      importId: result.importJobId,
      status:
        result.status === 'success'
          ? 'success'
          : result.status === 'duplicate'
            ? 'duplicate'
            : 'failed',
      activityId: result.status !== 'failed' ? result.activityId : undefined,
      errors: result.status === 'failed' ? [result.errorMessage] : [],
      warnings:
        result.status === 'failed' && result.warningMessages != null
          ? result.warningMessages
          : result.status === 'duplicate'
            ? [result.reason]
            : [],
    };

    const statusCode = result.status === 'success' ? 201 : result.status === 'duplicate' ? 200 : 422;
    return reply.status(statusCode).send(dto);
  });

  app.post('/api/imports/activity-file', async (request, reply) => {
    const config = getApiConfig();

    // 1. Get file part
    const data = await request.file().catch(() => null);
    if (data == null) {
      return reply.status(400).send({
        error: { code: 'NO_FILE', message: 'No file part in request' },
      });
    }

    // 2. Validate extension
    const ext = extname(data.filename).toLowerCase() as AllowedExt;
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      data.file.resume();
      return reply.status(400).send({
        error: {
          code: 'INVALID_FILE_TYPE',
          message: `Unsupported file type '${ext || '(none)'}'. Supported: ${ALLOWED_EXTENSIONS.join(', ')}`,
        },
      });
    }

    // 3. Read buffer — multipart plugin enforces size limit, throws on excess
    let buffer: Buffer;
    try {
      buffer = await data.toBuffer();
    } catch {
      return reply.status(400).send({
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File exceeds the maximum allowed size of ${config.importMaxFileSizeMb} MB`,
        },
      });
    }

    // 4. Compute hash and get profile
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    const profile = await AthleteRepository.findFirstAthleteProfile();
    if (profile == null) {
      throw ApiError.notFound('No athlete profile found');
    }

    // 4a. Check for existing file with same hash
    const existingFile = await ImportedFileRepository.findImportedFileByHash(
      profile.id,
      fileHash,
    );
    if (existingFile != null) {
      if (existingFile.createdActivityId != null) {
        // Activity still exists → true duplicate
        const dto: ImportResultDto = {
          importId: existingFile.id,
          status: 'duplicate',
          activityId: existingFile.createdActivityId,
          errors: [],
          warnings: ['This file has already been imported.'],
        };
        return reply.status(200).send(dto);
      }
      // Activity was deleted → remove stale record and re-import
      await ImportedFileRepository.deleteImportedFile(existingFile.id);
    }

    // 5. Store file
    const { storedPath } = await writeImportFile(config.importStoragePath, ext.slice(1), buffer);

    // 6. Persist ImportedFile + RawActivityData
    const sourceType = EXT_SOURCE_MAP[ext];
    const importedFile = await ImportedFileRepository.createImportedFile({
      athleteProfileId: profile.id,
      sourceType,
      fileName: data.filename,
      fileType: EXT_FILE_TYPE_MAP[ext],
      fileSizeBytes: buffer.byteLength,
      fileHash,
      importStatus: 'Processing',
    });

    await ImportedFileRepository.createRawActivityData({
      athleteProfileId: profile.id,
      sourceType,
      importedFileId: importedFile.id,
      rawFormat: EXT_RAW_FORMAT_MAP[ext],
      rawFilePath: storedPath,
    });

    // 7. Run pipeline (parsers are stubs until P4-007/P4-008)
    const result = await runImportPipeline({
      athleteProfileId: profile.id,
      source: sourceType as import('../import/types.js').ImportSourceType,
      input: buffer,
      rawPayloadHash: fileHash,
      importedFileId: importedFile.id,
    });

    const dto: ImportResultDto = {
      importId: result.importJobId,
      status:
        result.status === 'success'
          ? 'success'
          : result.status === 'duplicate'
            ? 'duplicate'
            : 'failed',
      activityId: result.status !== 'failed' ? result.activityId : undefined,
      errors: result.status === 'failed' ? [result.errorMessage] : [],
      warnings:
        result.status === 'failed' && result.warningMessages != null
          ? result.warningMessages
          : result.status === 'duplicate'
            ? [result.reason]
            : [],
    };

    const statusCode = result.status === 'success' ? 201 : result.status === 'duplicate' ? 200 : 422;
    return reply.status(statusCode).send(dto);
  });
}
