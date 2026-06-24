import {
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

export async function aiRoutes(app: FastifyInstance): Promise<void> {
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

  app.get('/api/ai/outputs/:id', async (request) => {
    const { id } = request.params as { id: string };
    return AiAcceptService.getOutput(id);
  });

  app.post('/api/ai/outputs/:id/accept', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await AiAcceptService.acceptOutput(id);
    return reply.status(201).send(result);
  });

  app.post('/api/ai/outputs/:id/reject', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await AiAcceptService.rejectOutput(id);
    return reply.status(200).send(result);
  });
}
