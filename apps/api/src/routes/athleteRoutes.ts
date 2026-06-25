import {
  CreateGoalInputSchema,
  PatchAthleteProfileInputSchema,
  ReorderGoalsInputSchema,
  UpdateGoalInputSchema,
} from '@pp-trainer/shared';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

import * as AthleteService from '../services/AthleteService.js';

function replyZodError(reply: FastifyReply, err: ZodError) {
  return reply.status(400).send({
    error: {
      code: 'VALIDATION_ERROR',
      message: err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
    },
  });
}

export async function athleteRoutes(app: FastifyInstance): Promise<void> {
  // ── Read ─────────────────────────────────────────────────────────────────

  app.get('/api/athlete/profile', async () => {
    return AthleteService.getAthleteSettings();
  });

  // ── Profile write ─────────────────────────────────────────────────────────

  app.patch('/api/athlete/profile', async (request, reply) => {
    let body: ReturnType<typeof PatchAthleteProfileInputSchema.parse>;
    try {
      body = PatchAthleteProfileInputSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) return replyZodError(reply, err);
      throw err;
    }
    const profile = await AthleteService.patchAthleteProfile(body);
    return reply.status(200).send(profile);
  });

  // ── Goal write ────────────────────────────────────────────────────────────

  app.post('/api/athlete/goals', async (request, reply) => {
    let body: ReturnType<typeof CreateGoalInputSchema.parse>;
    try {
      body = CreateGoalInputSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) return replyZodError(reply, err);
      throw err;
    }
    const goal = await AthleteService.createGoal(body);
    return reply.status(201).send(goal);
  });

  // PUT /priority must come BEFORE /:id to avoid Fastify treating "priority" as a param value
  app.put('/api/athlete/goals/priority', async (request, reply) => {
    let body: ReturnType<typeof ReorderGoalsInputSchema.parse>;
    try {
      body = ReorderGoalsInputSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) return replyZodError(reply, err);
      throw err;
    }
    await AthleteService.reorderGoals(body);
    return reply.status(204).send();
  });

  app.put('/api/athlete/goals/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    let body: ReturnType<typeof UpdateGoalInputSchema.parse>;
    try {
      body = UpdateGoalInputSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) return replyZodError(reply, err);
      throw err;
    }
    const goal = await AthleteService.updateGoal(id, body);
    return reply.status(200).send(goal);
  });

  app.delete('/api/athlete/goals/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await AthleteService.deleteGoal(id);
    return reply.status(204).send();
  });
}
