import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../errors/ApiError.js';
import { setupErrorHandling } from '../../errors/errorHandler.js';
import { activityRoutes } from '../../routes/activityRoutes.js';
import * as ActivityService from '../../services/ActivityService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../services/ActivityService.js');

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(activityRoutes);
  return app;
}

const mockSummary = {
  id: 'act-1',
  title: 'Morning Run',
  sport: 'running',
  activityType: 'easy',
  sourceType: 'mock',
  startTime: '2024-05-01T07:00:00.000Z',
  metrics: { durationSeconds: 3600, distanceMeters: 10000, averageHeartRateBpm: 142 },
};

const mockDetail = {
  ...mockSummary,
  laps: [],
  swimLaps: [],
  metricSamples: [],
  timeInZones: [],
  strengthSets: [],
  strengthExercises: [],
};

describe('GET /api/activities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 200 with activities array', async () => {
    vi.mocked(ActivityService.getActivities).mockResolvedValue({
      activities: [mockSummary as never],
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/activities' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ activities: unknown[] }>();
    expect(body.activities).toHaveLength(1);
  });

  it('returns empty array when no activities', async () => {
    vi.mocked(ActivityService.getActivities).mockResolvedValue({ activities: [] });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/activities' });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ activities: unknown[] }>().activities).toEqual([]);
  });

  it('passes sport filter to service', async () => {
    vi.mocked(ActivityService.getActivities).mockResolvedValue({ activities: [] });
    const app = buildTestApp();
    await app.inject({ method: 'GET', url: '/api/activities?sport=running' });
    expect(ActivityService.getActivities).toHaveBeenCalledWith(
      expect.objectContaining({ sport: 'running' }),
    );
  });

  it('passes dateFrom and dateTo filters to service', async () => {
    vi.mocked(ActivityService.getActivities).mockResolvedValue({ activities: [] });
    const app = buildTestApp();
    await app.inject({
      method: 'GET',
      url: '/api/activities?dateFrom=2024-05-01&dateTo=2024-05-31',
    });
    expect(ActivityService.getActivities).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: '2024-05-01', dateTo: '2024-05-31' }),
    );
  });

  it('returns 400 VALIDATION_ERROR for invalid sport value', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/activities?sport=invalid' });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 for unexpected service errors', async () => {
    vi.mocked(ActivityService.getActivities).mockRejectedValue(new Error('DB error'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/activities' });
    expect(res.statusCode).toBe(500);
  });
});

describe('GET /api/activities/:id', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 200 with activity detail', async () => {
    vi.mocked(ActivityService.getActivityById).mockResolvedValue(mockDetail as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/activities/act-1' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe('act-1');
    expect(body.laps).toEqual([]);
    expect(body.swimLaps).toEqual([]);
    expect(body.metricSamples).toEqual([]);
  });

  it('passes the id param to the service', async () => {
    vi.mocked(ActivityService.getActivityById).mockResolvedValue(mockDetail as never);
    const app = buildTestApp();
    await app.inject({ method: 'GET', url: '/api/activities/some-id-123' });
    expect(ActivityService.getActivityById).toHaveBeenCalledWith('some-id-123');
  });

  it('returns 404 NOT_FOUND for unknown activity id', async () => {
    vi.mocked(ActivityService.getActivityById).mockRejectedValue(
      ApiError.notFound('Activity not found'),
    );
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/activities/unknown' });
    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Activity not found');
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(ActivityService.getActivityById).mockRejectedValue(new Error('Unexpected'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/activities/act-1' });
    expect(res.statusCode).toBe(500);
  });
});
