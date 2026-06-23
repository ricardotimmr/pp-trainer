import {
  CreatePlannedWorkoutRequestSchema,
  CreateTrainingPlanRequestSchema,
  UpdatePlannedWorkoutRequestSchema,
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

  app.post('/api/workouts', async (request, reply) => {
    let body: unknown;
    try {
      body = CreatePlannedWorkoutRequestSchema.parse(request.body);
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
    const workout = await TrainingService.createWorkout(
      body as ReturnType<typeof CreatePlannedWorkoutRequestSchema.parse>,
    );
    return reply.status(201).send(workout);
  });

  app.put('/api/workouts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    let body: unknown;
    try {
      body = UpdatePlannedWorkoutRequestSchema.parse(request.body);
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
    const workout = await TrainingService.updateWorkout(
      id,
      body as ReturnType<typeof UpdatePlannedWorkoutRequestSchema.parse>,
    );
    return reply.status(200).send(workout);
  });

  app.delete('/api/workouts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await TrainingService.deleteWorkout(id);
    return reply.status(204).send();
  });
}
