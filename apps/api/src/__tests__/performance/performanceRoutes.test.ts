import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupErrorHandling } from '../../errors/errorHandler.js';
import { performanceRoutes } from '../../routes/performanceRoutes.js';
import * as PerformanceService from '../../services/PerformanceService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../services/PerformanceService.js');

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(performanceRoutes);
  return app;
}

const mockRunningMetric = {
  sport: 'running',
  vo2maxEstimate: 58.5,
  vo2maxEstimatedAt: '2024-05-01T10:00:00.000Z',
  thresholdHeartRateBpm: 168,
  thresholdPaceSecPerKm: 255,
};

const mockCyclingMetric = {
  sport: 'cycling',
  vo2maxEstimate: 61.0,
  ftpWatts: 280,
  ftpEstimatedAt: '2024-04-15T08:00:00.000Z',
};

const mockSwimmingMetric = {
  sport: 'swimming',
  thresholdPaceSecPer100m: 98,
};

const mockRunningPrediction = {
  sport: 'running',
  distanceLabel: '10 km',
  distanceMeters: 10000,
  predictedDurationSeconds: 2550,
  predictedPaceSecPerKm: 255,
  estimatedAt: '2024-05-01T10:00:00.000Z',
};

const mockCyclingPrediction = {
  sport: 'cycling',
  distanceLabel: '40 km',
  distanceMeters: 40000,
  predictedDurationSeconds: 3600,
  predictedSpeedKmh: 40.0,
  estimatedAt: '2024-04-15T08:00:00.000Z',
};

describe('GET /api/performance', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with sport metrics and race predictions', async () => {
    vi.mocked(PerformanceService.getPerformanceStats).mockResolvedValue({
      sportMetrics: [mockRunningMetric, mockCyclingMetric] as never,
      racePredictions: [mockRunningPrediction, mockCyclingPrediction] as never,
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/performance' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ sportMetrics: unknown[]; racePredictions: unknown[] }>();
    expect(body.sportMetrics).toHaveLength(2);
    expect(body.racePredictions).toHaveLength(2);
  });

  it('returns 200 with empty arrays when no athlete', async () => {
    vi.mocked(PerformanceService.getPerformanceStats).mockResolvedValue({
      sportMetrics: [],
      racePredictions: [],
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/performance' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ sportMetrics: unknown[]; racePredictions: unknown[] }>();
    expect(body.sportMetrics).toEqual([]);
    expect(body.racePredictions).toEqual([]);
  });

  it('returns 200 with sport-specific metrics (running has pace, cycling has FTP)', async () => {
    vi.mocked(PerformanceService.getPerformanceStats).mockResolvedValue({
      sportMetrics: [mockRunningMetric, mockCyclingMetric, mockSwimmingMetric] as never,
      racePredictions: [],
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/performance' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      sportMetrics: Array<{ sport: string; thresholdPaceSecPerKm?: number; ftpWatts?: number; thresholdPaceSecPer100m?: number }>;
    }>();
    const running = body.sportMetrics.find((m) => m.sport === 'running');
    const cycling = body.sportMetrics.find((m) => m.sport === 'cycling');
    const swimming = body.sportMetrics.find((m) => m.sport === 'swimming');
    expect(running?.thresholdPaceSecPerKm).toBe(255);
    expect(cycling?.ftpWatts).toBe(280);
    expect(swimming?.thresholdPaceSecPer100m).toBe(98);
  });

  it('returns 200 with missing swim predictors (no fake defaults)', async () => {
    vi.mocked(PerformanceService.getPerformanceStats).mockResolvedValue({
      sportMetrics: [mockSwimmingMetric] as never,
      racePredictions: [],
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/performance' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      sportMetrics: Array<{ sport: string; ftpWatts?: number; thresholdPaceSecPerKm?: number }>;
      racePredictions: unknown[];
    }>();
    const swimming = body.sportMetrics.find((m) => m.sport === 'swimming');
    expect('ftpWatts' in (swimming ?? {})).toBe(false);
    expect('thresholdPaceSecPerKm' in (swimming ?? {})).toBe(false);
    expect(body.racePredictions).toEqual([]);
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(PerformanceService.getPerformanceStats).mockRejectedValue(new Error('DB error'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/performance' });
    expect(res.statusCode).toBe(500);
  });
});
