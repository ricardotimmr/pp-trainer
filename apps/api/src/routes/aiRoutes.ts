import {
  GenerateWeekPlanRequestSchema,
  GenerateWorkoutRequestSchema,
} from '@pp-trainer/shared';
import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

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
}
