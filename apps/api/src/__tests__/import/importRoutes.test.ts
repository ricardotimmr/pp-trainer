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

const { findFirstAthleteProfile } = await import('../../repositories/AthleteRepository.js');
const { runImportPipeline } = await import('../../import/pipeline/runImportPipeline.js');

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(importRoutes);
  return app;
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

  it('passes rawPayloadHash to pipeline', async () => {
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
});

describe('POST /api/imports/activity-file', () => {
  it('returns 501 with NOT_IMPLEMENTED error body', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'POST', url: '/api/imports/activity-file' });
    expect(res.statusCode).toBe(501);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('NOT_IMPLEMENTED');
    expect(body.error.message).toContain('P4-006');
  });

  it('returns 501 regardless of request payload', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-file',
      payload: { fileName: 'run.fit' },
    });
    expect(res.statusCode).toBe(501);
  });
});
