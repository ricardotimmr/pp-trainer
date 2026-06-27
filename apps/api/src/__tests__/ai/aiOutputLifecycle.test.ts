import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../errors/ApiError.js';
import { setupErrorHandling } from '../../errors/errorHandler.js';
import { aiRoutes } from '../../routes/aiRoutes.js';
import * as AiAcceptService from '../../services/AiAcceptService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../services/AiAcceptService.js');
vi.mock('../../services/AiService.js');

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(aiRoutes);
  return app;
}

const mockOutputDto = {
  id: 'output-1',
  outputType: 'week_plan' as const,
  status: 'draft' as const,
  validationStatus: 'valid' as const,
  summary: 'Base endurance week',
  structuredOutput: { title: 'Base Week', weekStartDate: '2026-06-23', weekEndDate: '2026-06-29', workouts: [] },
  createdAt: '2026-06-23T10:00:00.000Z',
};

const mockPlanDto = {
  id: 'plan-1',
  title: 'Base Endurance Week',
  startDate: '2026-06-23',
  endDate: '2026-06-29',
  status: 'draft' as const,
  source: 'ai_generated' as const,
  plannedWorkouts: [],
};

const mockWorkoutDto = {
  id: 'workout-1',
  title: 'Interval Session',
  sport: 'running' as const,
  workoutType: 'vo2max' as const,
  scheduledDate: '2026-06-24',
  intensity: 'vo2max' as const,
  status: 'planned' as const,
  source: 'ai_generated' as const,
  steps: [],
};

// ── GET /api/ai/outputs/:id ──────────────────────────────────────────────────

describe('GET /api/ai/outputs/:id', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with AiCoachOutputDto', async () => {
    vi.mocked(AiAcceptService.getOutput).mockResolvedValue(mockOutputDto as never);
    const app = buildTestApp();

    const res = await app.inject({ method: 'GET', url: '/api/ai/outputs/output-1' });

    expect(res.statusCode).toBe(200);
    const body = res.json<typeof mockOutputDto>();
    expect(body.id).toBe('output-1');
    expect(body.outputType).toBe('week_plan');
    expect(body.validationStatus).toBe('valid');
  });

  it('calls getOutput with the correct id', async () => {
    vi.mocked(AiAcceptService.getOutput).mockResolvedValue(mockOutputDto as never);
    const app = buildTestApp();

    await app.inject({ method: 'GET', url: '/api/ai/outputs/output-abc' });

    expect(vi.mocked(AiAcceptService.getOutput)).toHaveBeenCalledWith('output-abc');
  });

  it('returns 404 when output not found', async () => {
    vi.mocked(AiAcceptService.getOutput).mockRejectedValue(ApiError.notFound('AI output not found'));
    const app = buildTestApp();

    const res = await app.inject({ method: 'GET', url: '/api/ai/outputs/missing' });

    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 when output belongs to different athlete', async () => {
    vi.mocked(AiAcceptService.getOutput).mockRejectedValue(ApiError.forbidden());
    const app = buildTestApp();

    const res = await app.inject({ method: 'GET', url: '/api/ai/outputs/other' });

    expect(res.statusCode).toBe(403);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ── POST /api/ai/outputs/:id/accept (week_plan) ──────────────────────────────

describe('POST /api/ai/outputs/:id/accept — week_plan', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 201 with TrainingPlanDto on success', async () => {
    vi.mocked(AiAcceptService.acceptOutput).mockResolvedValue(mockPlanDto as never);
    const app = buildTestApp();

    const res = await app.inject({ method: 'POST', url: '/api/ai/outputs/output-1/accept' });

    expect(res.statusCode).toBe(201);
    const body = res.json<typeof mockPlanDto>();
    expect(body.id).toBe('plan-1');
    expect(body.source).toBe('ai_generated');
    expect(body.status).toBe('draft');
  });

  it('calls acceptOutput with the correct id', async () => {
    vi.mocked(AiAcceptService.acceptOutput).mockResolvedValue(mockPlanDto as never);
    const app = buildTestApp();

    await app.inject({ method: 'POST', url: '/api/ai/outputs/output-abc/accept' });

    expect(vi.mocked(AiAcceptService.acceptOutput)).toHaveBeenCalledWith('output-abc', {});
  });

  it('returns 404 when output not found', async () => {
    vi.mocked(AiAcceptService.acceptOutput).mockRejectedValue(ApiError.notFound('AI output not found'));
    const app = buildTestApp();

    const res = await app.inject({ method: 'POST', url: '/api/ai/outputs/missing/accept' });

    expect(res.statusCode).toBe(404);
  });

  it('returns 409 when output already accepted', async () => {
    vi.mocked(AiAcceptService.acceptOutput).mockRejectedValue(
      ApiError.conflict('AI output has already been accepted or rejected'),
    );
    const app = buildTestApp();

    const res = await app.inject({ method: 'POST', url: '/api/ai/outputs/output-1/accept' });

    expect(res.statusCode).toBe(409);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('CONFLICT');
  });

  it('returns 422 when output has invalid validationStatus', async () => {
    vi.mocked(AiAcceptService.acceptOutput).mockRejectedValue(
      ApiError.unprocessable('AI output failed validation and cannot be accepted'),
    );
    const app = buildTestApp();

    const res = await app.inject({ method: 'POST', url: '/api/ai/outputs/output-1/accept' });

    expect(res.statusCode).toBe(422);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('UNPROCESSABLE');
  });

  it('returns 403 when output belongs to different athlete', async () => {
    vi.mocked(AiAcceptService.acceptOutput).mockRejectedValue(ApiError.forbidden());
    const app = buildTestApp();

    const res = await app.inject({ method: 'POST', url: '/api/ai/outputs/output-1/accept' });

    expect(res.statusCode).toBe(403);
  });
});

// ── POST /api/ai/outputs/:id/accept (single_workout) ────────────────────────

describe('POST /api/ai/outputs/:id/accept — single_workout', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 201 with PlannedWorkoutDto on success', async () => {
    vi.mocked(AiAcceptService.acceptOutput).mockResolvedValue(mockWorkoutDto as never);
    const app = buildTestApp();

    const res = await app.inject({ method: 'POST', url: '/api/ai/outputs/output-2/accept' });

    expect(res.statusCode).toBe(201);
    const body = res.json<typeof mockWorkoutDto>();
    expect(body.id).toBe('workout-1');
    expect(body.source).toBe('ai_generated');
  });

  it('passes single workout override body to the accept service', async () => {
    vi.mocked(AiAcceptService.acceptOutput).mockResolvedValue(mockWorkoutDto as never);
    const app = buildTestApp();
    const singleWorkoutOverride = {
      workout: {
        title: 'Edited Interval Session',
        sport: 'running',
        workoutType: 'vo2max',
        intensity: 'vo2max',
        objective: 'Edited workout objective',
        steps: [
          {
            stepIndex: 0,
            stepType: 'warmup',
            instruction: 'Edited warmup instruction',
            durationSeconds: 900,
          },
        ],
      },
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/outputs/output-2/accept',
      payload: { singleWorkoutOverride },
    });

    expect(res.statusCode).toBe(201);
    expect(vi.mocked(AiAcceptService.acceptOutput)).toHaveBeenCalledWith(
      'output-2',
      { singleWorkoutOverride },
    );
  });

  it('returns 400 when accept override body is invalid', async () => {
    vi.mocked(AiAcceptService.acceptOutput).mockResolvedValue(mockWorkoutDto as never);
    const app = buildTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/outputs/output-2/accept',
      payload: { singleWorkoutOverride: { workout: { title: '' } } },
    });

    expect(res.statusCode).toBe(400);
    expect(vi.mocked(AiAcceptService.acceptOutput)).not.toHaveBeenCalled();
  });
});

// ── POST /api/ai/outputs/:id/reject ─────────────────────────────────────────

describe('POST /api/ai/outputs/:id/reject', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with success: true', async () => {
    vi.mocked(AiAcceptService.rejectOutput).mockResolvedValue({ success: true });
    const app = buildTestApp();

    const res = await app.inject({ method: 'POST', url: '/api/ai/outputs/output-1/reject' });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ success: boolean }>();
    expect(body.success).toBe(true);
  });

  it('calls rejectOutput with correct id', async () => {
    vi.mocked(AiAcceptService.rejectOutput).mockResolvedValue({ success: true });
    const app = buildTestApp();

    await app.inject({ method: 'POST', url: '/api/ai/outputs/output-xyz/reject' });

    expect(vi.mocked(AiAcceptService.rejectOutput)).toHaveBeenCalledWith('output-xyz');
  });

  it('returns 409 when output already rejected', async () => {
    vi.mocked(AiAcceptService.rejectOutput).mockRejectedValue(
      ApiError.conflict('AI output has already been accepted or rejected'),
    );
    const app = buildTestApp();

    const res = await app.inject({ method: 'POST', url: '/api/ai/outputs/output-1/reject' });

    expect(res.statusCode).toBe(409);
  });

  it('returns 404 when output not found', async () => {
    vi.mocked(AiAcceptService.rejectOutput).mockRejectedValue(ApiError.notFound('AI output not found'));
    const app = buildTestApp();

    const res = await app.inject({ method: 'POST', url: '/api/ai/outputs/missing/reject' });

    expect(res.statusCode).toBe(404);
  });

  it('returns 403 when output belongs to different athlete', async () => {
    vi.mocked(AiAcceptService.rejectOutput).mockRejectedValue(ApiError.forbidden());
    const app = buildTestApp();

    const res = await app.inject({ method: 'POST', url: '/api/ai/outputs/other/reject' });

    expect(res.statusCode).toBe(403);
  });
});
