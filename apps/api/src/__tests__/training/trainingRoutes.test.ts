import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../errors/ApiError.js';
import { setupErrorHandling } from '../../errors/errorHandler.js';
import { trainingRoutes } from '../../routes/trainingRoutes.js';
import * as TrainingService from '../../services/TrainingService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../services/TrainingService.js');

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(trainingRoutes);
  return app;
}

const mockStep = {
  id: 'step-1',
  stepIndex: 0,
  stepType: 'warmup',
  instruction: '10 min easy jog',
  durationSeconds: 600,
};

const mockWorkout = {
  id: 'wo-1',
  trainingPlanId: 'plan-1',
  title: 'Easy Run',
  sport: 'running',
  workoutType: 'endurance',
  scheduledDate: '2024-06-10',
  intensity: 'easy',
  status: 'planned',
  source: 'manual',
  steps: [mockStep],
};

const mockPlan = {
  id: 'plan-1',
  title: 'Base Phase',
  startDate: '2024-06-03',
  endDate: '2024-08-25',
  status: 'active',
  source: 'manual',
  plannedWorkouts: [mockWorkout],
};

describe('GET /api/training-plans/current-week', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with plan and workouts', async () => {
    vi.mocked(TrainingService.getCurrentWeekPlan).mockResolvedValue({
      currentTrainingPlan: mockPlan as never,
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/training-plans/current-week' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ currentTrainingPlan: { id: string; plannedWorkouts: unknown[] } }>();
    expect(body.currentTrainingPlan?.id).toBe('plan-1');
    expect(body.currentTrainingPlan?.plannedWorkouts).toHaveLength(1);
  });

  it('returns 200 with null when no active plan', async () => {
    vi.mocked(TrainingService.getCurrentWeekPlan).mockResolvedValue({
      currentTrainingPlan: null,
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/training-plans/current-week' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ currentTrainingPlan: null }>();
    expect(body.currentTrainingPlan).toBeNull();
  });

  it('returns 200 with empty workouts array for empty week', async () => {
    vi.mocked(TrainingService.getCurrentWeekPlan).mockResolvedValue({
      currentTrainingPlan: { ...mockPlan, plannedWorkouts: [] } as never,
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/training-plans/current-week' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ currentTrainingPlan: { plannedWorkouts: unknown[] } }>();
    expect(body.currentTrainingPlan?.plannedWorkouts).toEqual([]);
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(TrainingService.getCurrentWeekPlan).mockRejectedValue(new Error('DB error'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/training-plans/current-week' });
    expect(res.statusCode).toBe(500);
  });
});

describe('GET /api/training-plans/:id', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with training plan', async () => {
    vi.mocked(TrainingService.getTrainingPlanById).mockResolvedValue(mockPlan as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/training-plans/plan-1' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe('plan-1');
    expect(body.status).toBe('active');
  });

  it('passes id to service', async () => {
    vi.mocked(TrainingService.getTrainingPlanById).mockResolvedValue(mockPlan as never);
    const app = buildTestApp();
    await app.inject({ method: 'GET', url: '/api/training-plans/plan-abc' });
    expect(TrainingService.getTrainingPlanById).toHaveBeenCalledWith('plan-abc');
  });

  it('returns 404 for unknown plan id', async () => {
    vi.mocked(TrainingService.getTrainingPlanById).mockRejectedValue(
      ApiError.notFound('Training plan not found'),
    );
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/training-plans/unknown' });
    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Training plan not found');
  });

  it('does not match current-week as :id', async () => {
    vi.mocked(TrainingService.getCurrentWeekPlan).mockResolvedValue({
      currentTrainingPlan: null,
    });
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/training-plans/current-week' });
    expect(TrainingService.getCurrentWeekPlan).toHaveBeenCalled();
    expect(TrainingService.getTrainingPlanById).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});

describe('GET /api/workouts/:id', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with workout and steps', async () => {
    vi.mocked(TrainingService.getWorkoutById).mockResolvedValue(mockWorkout as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/workouts/wo-1' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe('wo-1');
    expect(body.steps).toHaveLength(1);
    expect(body.steps[0].stepType).toBe('warmup');
  });

  it('passes id to service', async () => {
    vi.mocked(TrainingService.getWorkoutById).mockResolvedValue(mockWorkout as never);
    const app = buildTestApp();
    await app.inject({ method: 'GET', url: '/api/workouts/some-workout' });
    expect(TrainingService.getWorkoutById).toHaveBeenCalledWith('some-workout');
  });

  it('returns 404 for unknown workout id', async () => {
    vi.mocked(TrainingService.getWorkoutById).mockRejectedValue(
      ApiError.notFound('Workout not found'),
    );
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/workouts/unknown' });
    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Workout not found');
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(TrainingService.getWorkoutById).mockRejectedValue(new Error('Unexpected'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/workouts/wo-1' });
    expect(res.statusCode).toBe(500);
  });
});

const mockPlanSummary = {
  id: 'plan-1',
  title: 'Base Phase',
  startDate: '2024-06-03',
  endDate: '2024-08-25',
  status: 'active',
  source: 'manual',
};

const validPlanBody = {
  title: 'Base Phase',
  startDate: '2024-06-03',
  endDate: '2024-08-25',
  status: 'draft',
};

const validWorkoutBody = {
  title: 'Easy Run',
  sport: 'running',
  workoutType: 'endurance',
  scheduledDate: '2024-06-10',
  intensity: 'easy',
};

// ── GET /api/training-plans ───────────────────────────────────────────────────

describe('GET /api/training-plans', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with an array of plan summaries', async () => {
    vi.mocked(TrainingService.listTrainingPlans).mockResolvedValue([mockPlanSummary] as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/training-plans' });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
  });

  it('returns 200 with an empty array when no plans exist', async () => {
    vi.mocked(TrainingService.listTrainingPlans).mockResolvedValue([]);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/training-plans' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });
});

// ── POST /api/training-plans ──────────────────────────────────────────────────

describe('POST /api/training-plans', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 201 with the created plan for a valid body', async () => {
    vi.mocked(TrainingService.createTrainingPlan).mockResolvedValue(mockPlan as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/training-plans',
      payload: validPlanBody,
    });
    expect(res.statusCode).toBe(201);
    expect(res.json<{ id: string }>().id).toBe('plan-1');
  });

  it('returns 400 for a missing title', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/training-plans',
      payload: { startDate: '2024-06-03', endDate: '2024-08-25' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: { code: string } }>().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when endDate is before startDate', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/training-plans',
      payload: { ...validPlanBody, startDate: '2024-08-25', endDate: '2024-06-03' },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── PUT /api/training-plans/:id ───────────────────────────────────────────────

describe('PUT /api/training-plans/:id', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with the updated plan for a known id', async () => {
    vi.mocked(TrainingService.updateTrainingPlan).mockResolvedValue(mockPlan as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/training-plans/plan-1',
      payload: { title: 'Updated Title' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ id: string }>().id).toBe('plan-1');
  });

  it('returns 404 for an unknown plan id', async () => {
    vi.mocked(TrainingService.updateTrainingPlan).mockRejectedValue(
      ApiError.notFound('Training plan not found'),
    );
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/training-plans/unknown',
      payload: { title: 'X' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json<{ error: { code: string } }>().error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for an invalid body', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/training-plans/plan-1',
      payload: { status: 'invalid-status' },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── DELETE /api/training-plans/:id ───────────────────────────────────────────

describe('DELETE /api/training-plans/:id', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 204 for a known plan id', async () => {
    vi.mocked(TrainingService.deleteTrainingPlan).mockResolvedValue(undefined);
    const app = buildTestApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/training-plans/plan-1' });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 for an unknown plan id', async () => {
    vi.mocked(TrainingService.deleteTrainingPlan).mockRejectedValue(
      ApiError.notFound('Training plan not found'),
    );
    const app = buildTestApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/training-plans/unknown' });
    expect(res.statusCode).toBe(404);
  });
});

// ── GET /api/workouts ─────────────────────────────────────────────────────────

describe('GET /api/workouts', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with an array of workouts', async () => {
    vi.mocked(TrainingService.listWorkouts).mockResolvedValue([mockWorkout] as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/workouts' });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
  });

  it('returns 200 with an empty array when no workouts exist', async () => {
    vi.mocked(TrainingService.listWorkouts).mockResolvedValue([]);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/workouts' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });
});

// ── POST /api/workouts ────────────────────────────────────────────────────────

describe('POST /api/workouts', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 201 with the created workout for a valid body (no steps)', async () => {
    vi.mocked(TrainingService.createWorkout).mockResolvedValue(mockWorkout as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/workouts',
      payload: validWorkoutBody,
    });
    expect(res.statusCode).toBe(201);
    expect(res.json<{ id: string }>().id).toBe('wo-1');
  });

  it('returns 201 with steps present in the response', async () => {
    const workoutWithSteps = { ...mockWorkout, steps: [mockStep] };
    vi.mocked(TrainingService.createWorkout).mockResolvedValue(workoutWithSteps as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/workouts',
      payload: {
        ...validWorkoutBody,
        steps: [{ stepIndex: 0, stepType: 'warmup', instruction: '10 min easy jog' }],
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json<{ steps: unknown[] }>().steps).toHaveLength(1);
  });

  it('returns 400 for a missing required sport field', async () => {
    const app = buildTestApp();
    const { sport: _, ...withoutSport } = validWorkoutBody;
    const res = await app.inject({
      method: 'POST',
      url: '/api/workouts',
      payload: withoutSport,
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: { code: string } }>().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for duplicate stepIndex values', async () => {
    vi.mocked(TrainingService.createWorkout).mockRejectedValue(
      ApiError.badRequest('steps[].stepIndex must be unique — duplicate index: 0'),
    );
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/workouts',
      payload: {
        ...validWorkoutBody,
        steps: [
          { stepIndex: 0, stepType: 'warmup', instruction: 'a' },
          { stepIndex: 0, stepType: 'main', instruction: 'b' },
        ],
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── PUT /api/workouts/:id ─────────────────────────────────────────────────────

describe('PUT /api/workouts/:id', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with the updated workout for a known id', async () => {
    vi.mocked(TrainingService.updateWorkout).mockResolvedValue(mockWorkout as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/workouts/wo-1',
      payload: { title: 'Updated Run' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ id: string }>().id).toBe('wo-1');
  });

  it('returns 404 for an unknown workout id', async () => {
    vi.mocked(TrainingService.updateWorkout).mockRejectedValue(
      ApiError.notFound('Workout not found'),
    );
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/workouts/unknown',
      payload: { title: 'X' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json<{ error: { code: string } }>().error.code).toBe('NOT_FOUND');
  });
});

// ── DELETE /api/workouts/:id ──────────────────────────────────────────────────

describe('DELETE /api/workouts/:id', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 204 for a known workout id', async () => {
    vi.mocked(TrainingService.deleteWorkout).mockResolvedValue(undefined);
    const app = buildTestApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/workouts/wo-1' });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 for an unknown workout id', async () => {
    vi.mocked(TrainingService.deleteWorkout).mockRejectedValue(
      ApiError.notFound('Workout not found'),
    );
    const app = buildTestApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/workouts/unknown' });
    expect(res.statusCode).toBe(404);
    expect(res.json<{ error: { code: string } }>().error.code).toBe('NOT_FOUND');
  });
});
