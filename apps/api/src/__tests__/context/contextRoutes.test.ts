import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../errors/ApiError.js';
import { setupErrorHandling } from '../../errors/errorHandler.js';
import { contextRoutes } from '../../routes/contextRoutes.js';
import * as AthleteContextService from '../../services/AthleteContextService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../services/AthleteContextService.js');

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(contextRoutes);
  return app;
}

const mockContext = {
  version: 'v1',
  generatedAt: '2024-06-10T09:00:00.000Z',
  athleteProfile: {
    id: 'profile-1',
    displayName: 'Test Athlete',
    primarySports: ['running', 'cycling'],
    thresholds: { currentFtpWatts: 280 },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  goals: {
    mainGoal: { id: 'g1', title: 'Berlin Marathon', goalType: 'race', priority: 'main_goal', isActive: true },
    secondaryGoals: [],
    watchlistGoals: [],
  },
  availability: [],
  trainingZones: [],
  recentActivities: [],
  currentWeek: { weekStart: '2024-06-10', weekEnd: '2024-06-17', trainingPlan: null },
  performanceStats: { sportMetrics: [], racePredictions: [] },
};

const mockSnapshot = {
  id: 'snap-1',
  contextVersion: 'v1',
  generatedAt: '2024-06-10T09:00:00.000Z',
  goalSummary: 'Main goal: Berlin Marathon',
};

describe('GET /api/athlete/context', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with context object', async () => {
    vi.mocked(AthleteContextService.buildAthleteContext).mockResolvedValue(mockContext as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/context' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ context: typeof mockContext }>();
    expect(body.context.version).toBe('v1');
    expect(body.context.athleteProfile.id).toBe('profile-1');
  });

  it('includes structured goals with mainGoal, secondaryGoals, watchlistGoals', async () => {
    vi.mocked(AthleteContextService.buildAthleteContext).mockResolvedValue(mockContext as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/context' });
    const body = res.json<{ context: typeof mockContext }>();
    expect(body.context.goals.mainGoal?.id).toBe('g1');
    expect(body.context.goals.secondaryGoals).toEqual([]);
    expect(body.context.goals.watchlistGoals).toEqual([]);
  });

  it('returns currentWeek with null trainingPlan when no active plan', async () => {
    vi.mocked(AthleteContextService.buildAthleteContext).mockResolvedValue(mockContext as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/context' });
    const body = res.json<{ context: typeof mockContext }>();
    expect(body.context.currentWeek.trainingPlan).toBeNull();
    expect(body.context.currentWeek.weekStart).toBe('2024-06-10');
  });

  it('returns 404 when no athlete profile', async () => {
    vi.mocked(AthleteContextService.buildAthleteContext).mockResolvedValue(null);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/context' });
    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(AthleteContextService.buildAthleteContext).mockRejectedValue(new Error('DB error'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/context' });
    expect(res.statusCode).toBe(500);
  });
});

describe('POST /api/athlete/context/snapshot', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 201 with snapshot dto', async () => {
    vi.mocked(AthleteContextService.saveContextSnapshot).mockResolvedValue(mockSnapshot as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'POST', url: '/api/athlete/context/snapshot' });
    expect(res.statusCode).toBe(201);
    const body = res.json<typeof mockSnapshot>();
    expect(body.id).toBe('snap-1');
    expect(body.contextVersion).toBe('v1');
  });

  it('includes goalSummary in snapshot when present', async () => {
    vi.mocked(AthleteContextService.saveContextSnapshot).mockResolvedValue(mockSnapshot as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'POST', url: '/api/athlete/context/snapshot' });
    const body = res.json<typeof mockSnapshot>();
    expect(body.goalSummary).toBe('Main goal: Berlin Marathon');
  });

  it('returns 404 when no athlete profile', async () => {
    vi.mocked(AthleteContextService.saveContextSnapshot).mockRejectedValue(
      ApiError.notFound('Athlete profile not found'),
    );
    const app = buildTestApp();
    const res = await app.inject({ method: 'POST', url: '/api/athlete/context/snapshot' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(AthleteContextService.saveContextSnapshot).mockRejectedValue(new Error('DB error'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'POST', url: '/api/athlete/context/snapshot' });
    expect(res.statusCode).toBe(500);
  });
});
