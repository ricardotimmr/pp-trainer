import multipart from '@fastify/multipart';
import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupErrorHandling } from '../../errors/errorHandler.js';
import { importRoutes } from '../../routes/importRoutes.js';
import * as ImportService from '../../services/ImportService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../services/ImportService.js');
vi.mock('../../repositories/AthleteRepository.js');
vi.mock('../../import/pipeline/runImportPipeline.js');
vi.mock('../../services/ImportJobService.js');
vi.mock('../../lib/fileStorage.js');
vi.mock('../../repositories/ImportedFileRepository.js');
vi.mock('../../config/env.js', () => ({
  getApiConfig: () => ({
    importMaxFileSizeMb: 20,
    importStoragePath: '/tmp/test-imports',
    nodeEnv: 'test',
    port: 3001,
    webOrigin: 'http://localhost:5173',
    databaseUrl: 'postgresql://test',
  }),
}));

const { findFirstAthleteProfile } = await import('../../repositories/AthleteRepository.js');
const { runImportPipeline } = await import('../../import/pipeline/runImportPipeline.js');
const { getImports, getImportById } = await import('../../services/ImportJobService.js');
const { writeImportFile } = await import('../../lib/fileStorage.js');
const { createImportedFile, createRawActivityData } = await import(
  '../../repositories/ImportedFileRepository.js'
);

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });
  void app.register(importRoutes);
  return app;
}

function buildMultipart(boundary: string, filename: string, content: Buffer | string): Buffer {
  const nl = '\r\n';
  const body = Buffer.from(content);
  return Buffer.concat([
    Buffer.from(`--${boundary}${nl}`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"${nl}`),
    Buffer.from(`Content-Type: application/octet-stream${nl}`),
    Buffer.from(nl),
    body,
    Buffer.from(nl),
    Buffer.from(`--${boundary}--${nl}`),
  ]);
}

const mockProfile = { id: 'profile-1', displayName: 'Ricardo' };

const validJsonBody = {
  athleteProfileId: 'profile-1',
  sport: 'running',
  startTime: '2026-06-22T07:30:00Z',
  durationSeconds: 3600,
  distanceMeters: 12000,
  averageHeartRate: 148,
};

const mockImportItem = {
  id: 'file-1',
  sourceType: 'manual_fit_upload',
  fileName: 'morning_run.fit',
  fileType: 'fit',
  fileSizeBytes: 204800,
  importStatus: 'success',
  activityCount: 1,
  uploadedAt: '2024-05-01T08:00:00.000Z',
  processedAt: '2024-05-01T08:00:05.000Z',
};

describe('GET /api/import/history', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with imports array', async () => {
    vi.mocked(ImportService.getImportHistory).mockResolvedValue({
      imports: [mockImportItem as never],
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/import/history' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ imports: unknown[] }>();
    expect(body.imports).toHaveLength(1);
  });

  it('returns 200 with empty imports array when no athlete', async () => {
    vi.mocked(ImportService.getImportHistory).mockResolvedValue({ imports: [] });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/import/history' });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ imports: unknown[] }>().imports).toEqual([]);
  });

  it('returns import item with expected shape', async () => {
    vi.mocked(ImportService.getImportHistory).mockResolvedValue({
      imports: [mockImportItem as never],
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/import/history' });
    const body = res.json<{ imports: typeof mockImportItem[] }>();
    expect(body.imports[0].sourceType).toBe('manual_fit_upload');
    expect(body.imports[0].importStatus).toBe('success');
    expect(body.imports[0].activityCount).toBe(1);
  });

  it('returns failed import with errorMessage', async () => {
    vi.mocked(ImportService.getImportHistory).mockResolvedValue({
      imports: [
        {
          ...mockImportItem,
          importStatus: 'failed',
          errorMessage: 'Unsupported FIT file version',
          activityCount: 0,
          processedAt: undefined,
        } as never,
      ],
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/import/history' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ imports: Array<{ importStatus: string; errorMessage?: string }> }>();
    expect(body.imports[0].importStatus).toBe('failed');
    expect(body.imports[0].errorMessage).toBe('Unsupported FIT file version');
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(ImportService.getImportHistory).mockRejectedValue(new Error('DB error'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/import/history' });
    expect(res.statusCode).toBe(500);
  });
});

describe('POST /api/import/upload', () => {
  it('returns 501 with NOT_IMPLEMENTED error body', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'POST', url: '/api/import/upload' });
    expect(res.statusCode).toBe(501);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('NOT_IMPLEMENTED');
    expect(body.error.message).toContain('Phase 4');
  });

  it('returns 501 regardless of request body', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/import/upload',
      payload: { fileName: 'test.fit' },
    });
    expect(res.statusCode).toBe(501);
  });
});

describe('POST /api/imports/activity-json', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 201 with ImportResultDto on success', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(runImportPipeline).mockResolvedValue({
      status: 'success',
      importJobId: 'job-1',
      activityId: 'act-1',
    });

    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: validJsonBody,
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<{
      importId: string;
      status: string;
      activityId: string;
      errors: string[];
      warnings: string[];
    }>();
    expect(body.importId).toBe('job-1');
    expect(body.status).toBe('success');
    expect(body.activityId).toBe('act-1');
    expect(body.errors).toEqual([]);
    expect(body.warnings).toEqual([]);
  });

  it('returns 200 with duplicate status', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(runImportPipeline).mockResolvedValue({
      status: 'duplicate',
      importJobId: 'job-2',
      activityId: 'act-existing',
      reason: 'Same startTime and duration detected',
    });

    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: validJsonBody,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string; activityId: string; warnings: string[] }>();
    expect(body.status).toBe('duplicate');
    expect(body.activityId).toBe('act-existing');
    expect(body.warnings).toContain('Same startTime and duration detected');
  });

  it('returns 422 with error detail on failed pipeline', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(runImportPipeline).mockResolvedValue({
      status: 'failed',
      importJobId: 'job-3',
      errorMessage: 'Normalization failed',
    });

    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: validJsonBody,
    });

    expect(res.statusCode).toBe(422);
    const body = res.json<{ status: string; errors: string[] }>();
    expect(body.status).toBe('failed');
    expect(body.errors).toContain('Normalization failed');
  });

  it('returns 400 for missing required fields', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: { sport: 'running' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid sport value', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: { ...validJsonBody, sport: 'yoga' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid perceivedExertion > 10', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: { ...validJsonBody, perceivedExertion: 11 },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 403 when athleteProfileId does not match active profile', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue({ id: 'profile-2' } as never);

    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: { ...validJsonBody, athleteProfileId: 'profile-1' },
    });

    expect(res.statusCode).toBe(403);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 when no profile exists', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(null);

    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: validJsonBody,
    });

    expect(res.statusCode).toBe(404);
  });

  it('passes rawPayloadHash (sha256 hex) to pipeline', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(runImportPipeline).mockResolvedValue({
      status: 'success',
      importJobId: 'job-1',
      activityId: 'act-1',
    });

    const app = buildTestApp();
    await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: validJsonBody,
    });

    expect(runImportPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'ManualJsonImport',
        rawPayloadHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
  });

  it('passes forceImport: true to pipeline when set', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(runImportPipeline).mockResolvedValue({
      status: 'success',
      importJobId: 'job-1',
      activityId: 'act-1',
    });

    const app = buildTestApp();
    await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: { ...validJsonBody, forceImport: true },
    });

    expect(runImportPipeline).toHaveBeenCalledWith(
      expect.objectContaining({ forceImport: true }),
    );
  });

  it('excludes forceImport from the payload hash', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(runImportPipeline).mockResolvedValue({
      status: 'success',
      importJobId: 'job-1',
      activityId: 'act-1',
    });

    const app = buildTestApp();

    await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: validJsonBody,
    });
    const hashWithout = vi.mocked(runImportPipeline).mock.calls[0][0].rawPayloadHash;

    vi.resetAllMocks();
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(runImportPipeline).mockResolvedValue({
      status: 'success',
      importJobId: 'job-1',
      activityId: 'act-1',
    });

    await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: { ...validJsonBody, forceImport: true },
    });
    const hashWith = vi.mocked(runImportPipeline).mock.calls[0][0].rawPayloadHash;

    expect(hashWithout).toBe(hashWith);
  });
});

describe('GET /api/imports', () => {
  beforeEach(() => vi.resetAllMocks());

  const mockSummary = {
    id: 'job-1',
    status: 'success',
    sourceType: 'manual_json_import',
    sourceLabel: 'JSON Import',
    createdAt: '2026-06-22T10:00:00.000Z',
    activityId: 'act-1',
    errorMessage: null,
  };

  it('returns 200 with imports array', async () => {
    vi.mocked(getImports).mockResolvedValue({ imports: [mockSummary as never] });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/imports' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ imports: unknown[] }>();
    expect(body.imports).toHaveLength(1);
  });

  it('returns 200 with empty array when no jobs', async () => {
    vi.mocked(getImports).mockResolvedValue({ imports: [] });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/imports' });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ imports: unknown[] }>().imports).toEqual([]);
  });

  it('passes valid status filter to service', async () => {
    vi.mocked(getImports).mockResolvedValue({ imports: [] });
    const app = buildTestApp();
    await app.inject({ method: 'GET', url: '/api/imports?status=failed' });
    expect(getImports).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Failed' }),
    );
  });

  it('ignores invalid status filter', async () => {
    vi.mocked(getImports).mockResolvedValue({ imports: [] });
    const app = buildTestApp();
    await app.inject({ method: 'GET', url: '/api/imports?status=badvalue' });
    expect(getImports).toHaveBeenCalledWith(
      expect.objectContaining({ status: undefined }),
    );
  });

  it('passes limit and offset to service', async () => {
    vi.mocked(getImports).mockResolvedValue({ imports: [] });
    const app = buildTestApp();
    await app.inject({ method: 'GET', url: '/api/imports?limit=5&offset=10' });
    expect(getImports).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5, offset: 10 }),
    );
  });

  it('caps limit at 100', async () => {
    vi.mocked(getImports).mockResolvedValue({ imports: [] });
    const app = buildTestApp();
    await app.inject({ method: 'GET', url: '/api/imports?limit=999' });
    expect(getImports).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(getImports).mockRejectedValue(new Error('DB error'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/imports' });
    expect(res.statusCode).toBe(500);
  });
});

describe('GET /api/imports/:id', () => {
  beforeEach(() => vi.resetAllMocks());

  const mockDetail = {
    id: 'job-1',
    status: 'success',
    sourceType: 'manual_json_import',
    sourceLabel: 'JSON Import',
    createdAt: '2026-06-22T10:00:00.000Z',
    updatedAt: '2026-06-22T10:01:00.000Z',
    activityId: 'act-1',
    errorMessage: null,
    rawPayloadHash: 'abc123',
    warningMessages: [],
    importedFile: null,
  };

  it('returns 200 with import detail', async () => {
    vi.mocked(getImportById).mockResolvedValue(mockDetail as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/imports/job-1' });
    expect(res.statusCode).toBe(200);
    const body = res.json<typeof mockDetail>();
    expect(body.id).toBe('job-1');
    expect(body.rawPayloadHash).toBe('abc123');
    expect(body.warningMessages).toEqual([]);
    expect(body.importedFile).toBeNull();
  });

  it('returns detail with nested importedFile', async () => {
    vi.mocked(getImportById).mockResolvedValue({
      ...mockDetail,
      importedFile: {
        id: 'file-1',
        originalName: 'run.fit',
        fileSize: 204800,
        mimeType: 'application/octet-stream',
        fileType: 'fit',
      },
    } as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/imports/job-1' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ importedFile: { originalName: string } }>();
    expect(body.importedFile?.originalName).toBe('run.fit');
  });

  it('returns 404 for unknown id', async () => {
    const { ApiError } = await import('../../errors/ApiError.js');
    vi.mocked(getImportById).mockRejectedValue(ApiError.notFound("Import job 'unknown' not found"));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/imports/unknown' });
    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(getImportById).mockRejectedValue(new Error('DB down'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/imports/job-1' });
    expect(res.statusCode).toBe(500);
  });
});

describe('POST /api/imports/activity-file', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 400 when no file part in request', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'POST', url: '/api/imports/activity-file' });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('NO_FILE');
  });

  it('returns 400 for unsupported extension (.csv)', async () => {
    const boundary = 'bnd1';
    const payload = buildMultipart(boundary, 'data.csv', Buffer.from('col1,col2'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-file',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('INVALID_FILE_TYPE');
    expect(body.error.message).toContain('.fit');
  });

  it('returns 400 for file with no extension', async () => {
    const boundary = 'bnd2';
    const payload = buildMultipart(boundary, 'noextension', Buffer.from('data'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-file',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('returns 404 when no athlete profile exists', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(null);
    vi.mocked(writeImportFile).mockResolvedValue({ storedPath: '/tmp/uuid.fit', fileName: 'uuid.fit' });

    const boundary = 'bnd3';
    const payload = buildMultipart(boundary, 'activity.fit', Buffer.from('FIT'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-file',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 422 when FIT parser stub fails (not yet implemented)', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(writeImportFile).mockResolvedValue({ storedPath: '/tmp/uuid.fit', fileName: 'uuid.fit' });
    vi.mocked(createImportedFile).mockResolvedValue({ id: 'file-1' } as never);
    vi.mocked(createRawActivityData).mockResolvedValue({ id: 'raw-1' } as never);
    vi.mocked(runImportPipeline).mockResolvedValue({
      status: 'failed',
      importJobId: 'job-1',
      errorMessage: 'NOT_IMPLEMENTED: ManualFitUpload parser is not yet available',
    });

    const boundary = 'bnd4';
    const payload = buildMultipart(boundary, 'activity.fit', Buffer.from('FIT_DATA'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-file',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    });

    expect(res.statusCode).toBe(422);
    const body = res.json<{ status: string; errors: string[] }>();
    expect(body.status).toBe('failed');
    expect(runImportPipeline).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'ManualFitUpload', athleteProfileId: 'profile-1' }),
    );
  });

  it('dispatches pipeline with ManualGpxUpload for .gpx files', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(writeImportFile).mockResolvedValue({ storedPath: '/tmp/uuid.gpx', fileName: 'uuid.gpx' });
    vi.mocked(createImportedFile).mockResolvedValue({ id: 'file-2' } as never);
    vi.mocked(createRawActivityData).mockResolvedValue({ id: 'raw-2' } as never);
    vi.mocked(runImportPipeline).mockResolvedValue({
      status: 'failed',
      importJobId: 'job-2',
      errorMessage: 'NOT_IMPLEMENTED',
    });

    const boundary = 'bnd5';
    const payload = buildMultipart(boundary, 'run.gpx', Buffer.from('<gpx/>'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-file',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    });

    expect(res.statusCode).toBe(422);
    expect(runImportPipeline).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'ManualGpxUpload' }),
    );
  });

  it('dispatches pipeline with ManualTcxUpload for .tcx files', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(writeImportFile).mockResolvedValue({ storedPath: '/tmp/uuid.tcx', fileName: 'uuid.tcx' });
    vi.mocked(createImportedFile).mockResolvedValue({ id: 'file-3' } as never);
    vi.mocked(createRawActivityData).mockResolvedValue({ id: 'raw-3' } as never);
    vi.mocked(runImportPipeline).mockResolvedValue({
      status: 'failed',
      importJobId: 'job-3',
      errorMessage: 'NOT_IMPLEMENTED',
    });

    const boundary = 'bnd6';
    const payload = buildMultipart(boundary, 'bike.tcx', Buffer.from('<TrainingCenterDatabase/>'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-file',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    });

    expect(res.statusCode).toBe(422);
    expect(runImportPipeline).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'ManualTcxUpload' }),
    );
  });

  it('passes rawPayloadHash (sha256 of file bytes) to pipeline', async () => {
    vi.mocked(findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(writeImportFile).mockResolvedValue({ storedPath: '/tmp/uuid.fit', fileName: 'uuid.fit' });
    vi.mocked(createImportedFile).mockResolvedValue({ id: 'file-4' } as never);
    vi.mocked(createRawActivityData).mockResolvedValue({ id: 'raw-4' } as never);
    vi.mocked(runImportPipeline).mockResolvedValue({
      status: 'failed',
      importJobId: 'job-4',
      errorMessage: 'NOT_IMPLEMENTED',
    });

    const boundary = 'bnd7';
    const payload = buildMultipart(boundary, 'activity.fit', Buffer.from('FIT_DATA'));
    const app = buildTestApp();
    await app.inject({
      method: 'POST',
      url: '/api/imports/activity-file',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    });

    expect(runImportPipeline).toHaveBeenCalledWith(
      expect.objectContaining({ rawPayloadHash: expect.stringMatching(/^[a-f0-9]{64}$/) }),
    );
  });
});
