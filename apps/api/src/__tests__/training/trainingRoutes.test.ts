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
