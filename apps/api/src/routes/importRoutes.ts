import { createHash } from 'node:crypto';

import { ActivityJsonImportRequestSchema, type ImportResultDto } from '@pp-trainer/shared';
import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import { ApiError } from '../errors/ApiError.js';
import { DTO_TO_PRISMA_IMPORT_STATUS_MAP } from '../mappers/enumMaps.js';
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

const FILE_IMPORT_NOT_IMPLEMENTED_BODY = {
  error: {
    code: 'NOT_IMPLEMENTED',
    message: 'File upload and parsing are not yet implemented. Coming in P4-006/P4-007/P4-008.',
  },
} as const;

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

  app.post('/api/imports/activity-file', async (_request, reply) => {
    return reply.status(501).send(FILE_IMPORT_NOT_IMPLEMENTED_BODY);
  });
}
