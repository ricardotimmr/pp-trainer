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

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(importRoutes);
  return app;
}

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
  it('returns 501 with NOT_IMPLEMENTED error body', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'POST', url: '/api/imports/activity-json' });
    expect(res.statusCode).toBe(501);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('NOT_IMPLEMENTED');
    expect(body.error.message).toContain('P4-003');
  });

  it('returns 501 regardless of request payload', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/imports/activity-json',
      payload: { sport: 'Running', startTime: '2026-06-22T08:00:00Z' },
    });
    expect(res.statusCode).toBe(501);
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
