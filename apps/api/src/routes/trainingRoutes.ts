import {
  CreateTrainingPlanRequestSchema,
  UpdateTrainingPlanRequestSchema,
} from '@pp-trainer/shared';
import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import * as TrainingService from '../services/TrainingService.js';

export async function trainingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/training-plans/current-week', async () => {
    return TrainingService.getCurrentWeekPlan();
  });

  app.get('/api/training-plans', async () => {
    return TrainingService.listTrainingPlans();
  });

  app.post('/api/training-plans', async (request, reply) => {
    let body: unknown;
    try {
      body = CreateTrainingPlanRequestSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
          },
        });
      }
      throw err;
    }
    const plan = await TrainingService.createTrainingPlan(
      body as ReturnType<typeof CreateTrainingPlanRequestSchema.parse>,
    );
    return reply.status(201).send(plan);
  });

  app.get('/api/training-plans/:id', async (request) => {
    const { id } = request.params as { id: string };
    return TrainingService.getTrainingPlanById(id);
  });

  app.put('/api/training-plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    let body: unknown;
    try {
      body = UpdateTrainingPlanRequestSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
          },
        });
      }
      throw err;
    }
    const plan = await TrainingService.updateTrainingPlan(
      id,
      body as ReturnType<typeof UpdateTrainingPlanRequestSchema.parse>,
    );
    return reply.status(200).send(plan);
  });

  app.get('/api/workouts/:id', async (request) => {
    const { id } = request.params as { id: string };
    return TrainingService.getWorkoutById(id);
  });
}
