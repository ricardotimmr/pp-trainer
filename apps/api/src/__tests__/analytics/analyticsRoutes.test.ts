import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupErrorHandling } from '../../errors/errorHandler.js';
import { analyticsRoutes } from '../../routes/analyticsRoutes.js';
import * as AnalyticsService from '../../services/AnalyticsService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../services/AnalyticsService.js');

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(analyticsRoutes);
  return app;
}

describe('GET /api/analytics/weekly-summary', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns weekly summaries using the default week count', async () => {
    vi.mocked(AnalyticsService.getCurrentAthleteWeeklySummaries).mockResolvedValue([
      {
        weekStart: '2024-05-06',
        totalSeconds: 3600,
        bySport: [{ sport: 'running', seconds: 3600 }],
      },
    ]);

    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/analytics/weekly-summary' });

    expect(res.statusCode).toBe(200);
    expect(AnalyticsService.getCurrentAthleteWeeklySummaries).toHaveBeenCalledWith(8);
    expect(res.json()).toEqual([
      {
        weekStart: '2024-05-06',
        totalSeconds: 3600,
        bySport: [{ sport: 'running', seconds: 3600 }],
      },
    ]);
  });

  it('passes a valid explicit week count to the service', async () => {
    vi.mocked(AnalyticsService.getCurrentAthleteWeeklySummaries).mockResolvedValue([]);

    const app = buildTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/analytics/weekly-summary?weeks=12',
    });

    expect(res.statusCode).toBe(200);
    expect(AnalyticsService.getCurrentAthleteWeeklySummaries).toHaveBeenCalledWith(12);
  });

  it('returns 400 for invalid weeks values', async () => {
    const app = buildTestApp();

    for (const weeks of ['0', '27', '5e1', 'abc']) {
      const res = await app.inject({
        method: 'GET',
        url: `/api/analytics/weekly-summary?weeks=${weeks}`,
      });
      expect(res.statusCode).toBe(400);
      expect(res.json<{ error: { message: string } }>().error.message).toBe(
        'weeks must be an integer between 1 and 26',
      );
    }
  });
});

describe('GET /api/analytics/sport-distribution', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns sport distribution for a valid date range', async () => {
    vi.mocked(AnalyticsService.getCurrentAthleteSportDistribution).mockResolvedValue([
      { sport: 'cycling', activityCount: 2, totalSeconds: 7200 },
    ]);

    const app = buildTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/analytics/sport-distribution?from=2024-05-01&to=2024-05-31',
    });

    expect(res.statusCode).toBe(200);
    expect(AnalyticsService.getCurrentAthleteSportDistribution).toHaveBeenCalledWith(
      '2024-05-01',
      '2024-05-31',
    );
    expect(res.json()).toEqual([
      { sport: 'cycling', activityCount: 2, totalSeconds: 7200 },
    ]);
  });

  it('returns 400 when from or to is missing', async () => {
    const app = buildTestApp();

    const missingFrom = await app.inject({
      method: 'GET',
      url: '/api/analytics/sport-distribution?to=2024-05-31',
    });
    const missingTo = await app.inject({
      method: 'GET',
      url: '/api/analytics/sport-distribution?from=2024-05-01',
    });

    expect(missingFrom.statusCode).toBe(400);
    expect(missingFrom.json<{ error: { message: string } }>().error.message).toBe(
      'from must be a valid YYYY-MM-DD date',
    );
    expect(missingTo.statusCode).toBe(400);
    expect(missingTo.json<{ error: { message: string } }>().error.message).toBe(
      'to must be a valid YYYY-MM-DD date',
    );
  });

  it('returns 400 for invalid date formats', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/analytics/sport-distribution?from=2024-5-1&to=2024-05-31',
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: { message: string } }>().error.message).toBe(
      'from must be a valid YYYY-MM-DD date',
    );
  });

  it('returns 400 for invalid calendar dates', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/analytics/sport-distribution?from=2024-02-31&to=2024-05-31',
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: { message: string } }>().error.message).toBe(
      'from must be a valid YYYY-MM-DD date',
    );
  });

  it('returns 400 when from is after to', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/analytics/sport-distribution?from=2024-06-01&to=2024-05-31',
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: { message: string } }>().error.message).toBe(
      'from must be before or equal to to',
    );
    expect(AnalyticsService.getCurrentAthleteSportDistribution).not.toHaveBeenCalled();
  });
});
