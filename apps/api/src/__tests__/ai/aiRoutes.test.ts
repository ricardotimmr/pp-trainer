import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../errors/ApiError.js';
import { setupErrorHandling } from '../../errors/errorHandler.js';
import { aiRoutes } from '../../routes/aiRoutes.js';
import * as AiService from '../../services/AiService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../services/AiService.js');

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(aiRoutes);
  return app;
}

const mockOutput = {
  id: 'output-1',
  outputType: 'week_plan' as const,
  status: 'draft' as const,
  validationStatus: 'valid' as const,
  summary: 'A balanced base endurance week.',
  structuredOutput: { title: 'Base Week', workouts: [] },
  createdAt: '2026-06-23T10:00:00.000Z',
};

const mockSingleOutput = {
  id: 'output-2',
  outputType: 'single_workout' as const,
  status: 'draft' as const,
  validationStatus: 'valid' as const,
  summary: 'Interval training session',
  structuredOutput: { workout: { title: 'Intervals', steps: [] } },
  createdAt: '2026-06-23T10:00:00.000Z',
};

// ── POST /api/ai/generate-week-plan ──────────────────────────────────────────

describe('POST /api/ai/generate-week-plan', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 201 with AiCoachOutputDto on success', async () => {
    vi.mocked(AiService.generateWeekPlan).mockResolvedValue(mockOutput as never);
    const app = buildTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-week-plan',
      payload: { weekStartDate: '2026-06-23' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<typeof mockOutput>();
    expect(body.id).toBe('output-1');
    expect(body.outputType).toBe('week_plan');
    expect(body.status).toBe('draft');
    expect(body.validationStatus).toBe('valid');
  });

  it('passes weekStartDate and userInstruction to AiService', async () => {
    vi.mocked(AiService.generateWeekPlan).mockResolvedValue(mockOutput as never);
    const app = buildTestApp();

    await app.inject({
      method: 'POST',
      url: '/api/ai/generate-week-plan',
      payload: { weekStartDate: '2026-06-23', userInstruction: 'Focus on cycling' },
    });

    expect(vi.mocked(AiService.generateWeekPlan)).toHaveBeenCalledWith({
      weekStartDate: '2026-06-23',
      userInstruction: 'Focus on cycling',
    });
  });

  it('returns 400 when weekStartDate is missing', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-week-plan',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when body is not an object', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-week-plan',
      payload: 'not-an-object',
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when no athlete profile exists', async () => {
    vi.mocked(AiService.generateWeekPlan).mockRejectedValue(ApiError.notFound('Athlete profile not found'));
    const app = buildTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-week-plan',
      payload: { weekStartDate: '2026-06-23' },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 502 when AI provider fails', async () => {
    vi.mocked(AiService.generateWeekPlan).mockRejectedValue(ApiError.badGateway());
    const app = buildTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-week-plan',
      payload: { weekStartDate: '2026-06-23' },
    });

    expect(res.statusCode).toBe(502);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('BAD_GATEWAY');
  });

  it('returns 201 even when validationStatus is invalid', async () => {
    vi.mocked(AiService.generateWeekPlan).mockResolvedValue({
      ...mockOutput,
      validationStatus: 'invalid' as const,
    } as never);
    const app = buildTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-week-plan',
      payload: { weekStartDate: '2026-06-23' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<{ validationStatus: string }>();
    expect(body.validationStatus).toBe('invalid');
  });

  it('includes structuredOutput in response', async () => {
    vi.mocked(AiService.generateWeekPlan).mockResolvedValue(mockOutput as never);
    const app = buildTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-week-plan',
      payload: { weekStartDate: '2026-06-23' },
    });

    const body = res.json<typeof mockOutput>();
    expect(body.structuredOutput).toBeDefined();
  });
});

// ── POST /api/ai/generate-workout ────────────────────────────────────────────

describe('POST /api/ai/generate-workout', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 201 with AiCoachOutputDto on success', async () => {
    vi.mocked(AiService.generateWorkout).mockResolvedValue(mockSingleOutput as never);
    const app = buildTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-workout',
      payload: { sport: 'running', intensity: 'threshold' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<typeof mockSingleOutput>();
    expect(body.id).toBe('output-2');
    expect(body.outputType).toBe('single_workout');
  });

  it('passes full request to AiService', async () => {
    vi.mocked(AiService.generateWorkout).mockResolvedValue(mockSingleOutput as never);
    const app = buildTestApp();

    await app.inject({
      method: 'POST',
      url: '/api/ai/generate-workout',
      payload: {
        sport: 'cycling',
        intensity: 'vo2max',
        plannedDurationSeconds: 3600,
        scheduledDate: '2026-06-25',
        userInstruction: 'Three threshold blocks',
      },
    });

    expect(vi.mocked(AiService.generateWorkout)).toHaveBeenCalledWith({
      sport: 'cycling',
      intensity: 'vo2max',
      plannedDurationSeconds: 3600,
      scheduledDate: '2026-06-25',
      userInstruction: 'Three threshold blocks',
    });
  });

  it('returns 400 when sport is missing', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-workout',
      payload: { intensity: 'easy' },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when sport is not a valid enum value', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-workout',
      payload: { sport: 'skateboarding', intensity: 'easy' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when intensity is missing', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-workout',
      payload: { sport: 'running' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 502 when AI provider fails', async () => {
    vi.mocked(AiService.generateWorkout).mockRejectedValue(
      ApiError.badGateway('OpenAI API error: timeout'),
    );
    const app = buildTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-workout',
      payload: { sport: 'running', intensity: 'easy' },
    });

    expect(res.statusCode).toBe(502);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(AiService.generateWorkout).mockRejectedValue(ApiError.rateLimited());
    const app = buildTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-workout',
      payload: { sport: 'running', intensity: 'easy' },
    });

    expect(res.statusCode).toBe(429);
  });
});

// ── GET /api/ai/history ───────────────────────────────────────────────────────

describe('GET /api/ai/history', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 200 with array of outputs using default limit', async () => {
    vi.mocked(AiService.getHistory).mockResolvedValue([mockOutput as never]);
    const app = buildTestApp();

    const res = await app.inject({ method: 'GET', url: '/api/ai/history' });

    expect(res.statusCode).toBe(200);
    const body = res.json<typeof mockOutput[]>();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('output-1');
    expect(AiService.getHistory).toHaveBeenCalledWith(10);
  });

  it('passes custom limit to service', async () => {
    vi.mocked(AiService.getHistory).mockResolvedValue([]);
    const app = buildTestApp();

    const res = await app.inject({ method: 'GET', url: '/api/ai/history?limit=25' });

    expect(res.statusCode).toBe(200);
    expect(AiService.getHistory).toHaveBeenCalledWith(25);
  });

  it('returns 200 with empty array when no outputs exist', async () => {
    vi.mocked(AiService.getHistory).mockResolvedValue([]);
    const app = buildTestApp();

    const res = await app.inject({ method: 'GET', url: '/api/ai/history' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns 400 for limit=0', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/ai/history?limit=0' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for limit exceeding max (51)', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/ai/history?limit=51' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-numeric limit', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/ai/history?limit=abc' });
    expect(res.statusCode).toBe(400);
  });

  it('accepts limit=50 (max valid)', async () => {
    vi.mocked(AiService.getHistory).mockResolvedValue([]);
    const app = buildTestApp();

    const res = await app.inject({ method: 'GET', url: '/api/ai/history?limit=50' });

    expect(res.statusCode).toBe(200);
    expect(AiService.getHistory).toHaveBeenCalledWith(50);
  });
});
