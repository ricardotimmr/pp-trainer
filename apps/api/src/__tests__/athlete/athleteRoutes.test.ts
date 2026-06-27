import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../errors/ApiError.js';
import { setupErrorHandling } from '../../errors/errorHandler.js';
import { athleteRoutes } from '../../routes/athleteRoutes.js';
import * as AthleteService from '../../services/AthleteService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../services/AthleteService.js');

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(athleteRoutes);
  return app;
}

const mockSettings = {
  athleteProfile: {
    id: 'profile-1',
    displayName: 'Test Athlete',
    primarySports: ['cycling', 'running'],
    thresholds: { currentFtpWatts: 280, maxHeartRateBpm: 185 },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  goals: [
    {
      id: 'goal-1',
      title: 'Run a marathon',
      goalType: 'race',
      priority: 'main_goal',
      isActive: true,
    },
  ],
  availability: [
    { weekday: 'monday', available: true, preferredSports: ['running'] },
  ],
  trainingZoneSets: [],
};

afterEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/athlete/profile', () => {

  it('returns 200 with athlete settings shape', async () => {
    vi.mocked(AthleteService.getAthleteSettings).mockResolvedValue(mockSettings as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/profile' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.athleteProfile.id).toBe('profile-1');
    expect(body.athleteProfile.displayName).toBe('Test Athlete');
    expect(body.athleteProfile.primarySports).toEqual(['cycling', 'running']);
  });

  it('returns goals with priority semantics', async () => {
    vi.mocked(AthleteService.getAthleteSettings).mockResolvedValue(mockSettings as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/profile' });
    const body = res.json();
    expect(body.goals[0].priority).toBe('main_goal');
  });

  it('returns availability array', async () => {
    vi.mocked(AthleteService.getAthleteSettings).mockResolvedValue(mockSettings as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/profile' });
    const body = res.json();
    expect(body.availability[0].weekday).toBe('monday');
  });

  it('returns 404 with NOT_FOUND when no profile exists', async () => {
    vi.mocked(AthleteService.getAthleteSettings).mockRejectedValue(
      ApiError.notFound('Athlete profile not found'),
    );
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/profile' });
    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Athlete profile not found');
  });

  it('returns 500 for unexpected service errors', async () => {
    vi.mocked(AthleteService.getAthleteSettings).mockRejectedValue(new Error('DB connection lost'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/profile' });
    expect(res.statusCode).toBe(500);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});

// ── PATCH /api/athlete/profile ────────────────────────────────────────────────

describe('PATCH /api/athlete/profile', () => {
  it('returns 200 with updated profile', async () => {
    vi.mocked(AthleteService.patchAthleteProfile).mockResolvedValue({ id: 'profile-1', displayName: 'New Name' } as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/athlete/profile',
      payload: { displayName: 'New Name' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().displayName).toBe('New Name');
  });

  it('returns 400 for invalid payload', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/athlete/profile',
      payload: { displayName: '' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when no profile exists', async () => {
    vi.mocked(AthleteService.patchAthleteProfile).mockRejectedValue(ApiError.notFound('Athlete profile not found'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/athlete/profile',
      payload: { displayName: 'X' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});

// ── POST /api/athlete/goals ───────────────────────────────────────────────────

const mockGoalDto = {
  id: 'goal-1',
  title: 'Run a marathon',
  goalType: 'race',
  priority: 'main_goal',
  isActive: true,
};

describe('POST /api/athlete/goals', () => {
  it('returns 201 with created goal', async () => {
    vi.mocked(AthleteService.createGoal).mockResolvedValue(mockGoalDto as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/athlete/goals',
      payload: { title: 'Run a marathon', goalType: 'race', priority: 'main_goal' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBe('goal-1');
  });

  it('returns 400 for missing required fields', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/athlete/goals',
      payload: { title: 'Only title' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });
});

// ── PUT /api/athlete/goals/priority ──────────────────────────────────────────

describe('PUT /api/athlete/goals/priority', () => {
  it('returns 204 on success', async () => {
    vi.mocked(AthleteService.reorderGoals).mockResolvedValue();
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/athlete/goals/priority',
      payload: { items: [{ id: 'goal-1', priority: 'main_goal' }] },
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 400 for empty items array', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/athlete/goals/priority',
      payload: { items: [] },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });
});

// ── PUT /api/athlete/goals/:id ────────────────────────────────────────────────

describe('PUT /api/athlete/goals/:id', () => {
  it('returns 200 with updated goal', async () => {
    vi.mocked(AthleteService.updateGoal).mockResolvedValue({ ...mockGoalDto, title: 'Ultra' } as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/athlete/goals/goal-1',
      payload: { title: 'Ultra' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().title).toBe('Ultra');
  });

  it('returns 404 when goal not found', async () => {
    vi.mocked(AthleteService.updateGoal).mockRejectedValue(ApiError.notFound('Goal not found'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/athlete/goals/missing',
      payload: { title: 'X' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});

// ── DELETE /api/athlete/goals/:id ─────────────────────────────────────────────

describe('DELETE /api/athlete/goals/:id', () => {
  it('returns 204 on success', async () => {
    vi.mocked(AthleteService.deleteGoal).mockResolvedValue();
    const app = buildTestApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/athlete/goals/goal-1' });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 when goal not found', async () => {
    vi.mocked(AthleteService.deleteGoal).mockRejectedValue(ApiError.notFound('Goal not found'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/athlete/goals/missing' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});
