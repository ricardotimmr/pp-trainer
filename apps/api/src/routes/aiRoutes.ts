import {
  AcceptAiOutputRequestSchema,
  GenerateWeekAnalysisRequestSchema,
  GenerateWeekPlanRequestSchema,
  GenerateWorkoutRequestSchema,
} from '@pp-trainer/shared';
import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import * as AiAcceptService from '../services/AiAcceptService.js';
import * as AiService from '../services/AiService.js';

function zodValidationError(err: ZodError): { error: { code: string; message: string } } {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
    },
  };
}

const HISTORY_DEFAULT_LIMIT = 10;
const HISTORY_MAX_LIMIT = 50;

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/ai/history', async (request, reply) => {
    const { limit: limitRaw } = request.query as { limit?: string };
    let limit = HISTORY_DEFAULT_LIMIT;
    if (limitRaw !== undefined) {
      const parsed = /^\d+$/.test(limitRaw) ? parseInt(limitRaw, 10) : NaN;
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > HISTORY_MAX_LIMIT) {
        return reply.status(400).send({
          error: {
            code: 'BAD_REQUEST',
            message: `limit must be an integer between 1 and ${HISTORY_MAX_LIMIT}`,
          },
        });
      }
      limit = parsed;
    }
    return AiService.getHistory(limit);
  });

  app.post('/api/ai/generate-week-plan', async (request, reply) => {
    let body: unknown;
    try {
      body = GenerateWeekPlanRequestSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) return reply.status(400).send(zodValidationError(err));
      throw err;
    }

    const output = await AiService.generateWeekPlan(
      body as ReturnType<typeof GenerateWeekPlanRequestSchema.parse>,
    );
    return reply.status(201).send(output);
  });

  app.post('/api/ai/generate-workout', async (request, reply) => {
    let body: unknown;
    try {
      body = GenerateWorkoutRequestSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) return reply.status(400).send(zodValidationError(err));
      throw err;
    }

    const output = await AiService.generateWorkout(
      body as ReturnType<typeof GenerateWorkoutRequestSchema.parse>,
    );
    return reply.status(201).send(output);
  });

  app.post('/api/ai/generate-week-analysis', async (request, reply) => {
    let body: unknown;
    try {
      body = GenerateWeekAnalysisRequestSchema.parse(request.body ?? {});
    } catch (err) {
      if (err instanceof ZodError) return reply.status(400).send(zodValidationError(err));
      throw err;
    }

    const output = await AiService.generateWeekAnalysis(
      body as ReturnType<typeof GenerateWeekAnalysisRequestSchema.parse>,
    );
    return reply.status(201).send(output);
  });

  app.get('/api/ai/outputs/:id', async (request) => {
    const { id } = request.params as { id: string };
    return AiAcceptService.getOutput(id);
  });

  app.post('/api/ai/outputs/:id/accept', async (request, reply) => {
    const { id } = request.params as { id: string };
    let body: unknown;
    try {
      body = AcceptAiOutputRequestSchema.parse(request.body ?? {});
    } catch (err) {
      if (err instanceof ZodError) return reply.status(400).send(zodValidationError(err));
      throw err;
    }

    const result = await AiAcceptService.acceptOutput(
      id,
      body as ReturnType<typeof AcceptAiOutputRequestSchema.parse>,
    );
    return reply.status(201).send(result);
  });

  app.post('/api/ai/outputs/:id/reject', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await AiAcceptService.rejectOutput(id);
    return reply.status(200).send(result);
  });
}
