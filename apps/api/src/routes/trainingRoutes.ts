import type { FastifyInstance } from 'fastify';

import * as TrainingService from '../services/TrainingService.js';

export async function trainingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/training-plans/current-week', async () => {
    return TrainingService.getCurrentWeekPlan();
  });

  app.get('/api/training-plans/:id', async (request) => {
    const { id } = request.params as { id: string };
    return TrainingService.getTrainingPlanById(id);
  });

  app.get('/api/workouts/:id', async (request) => {
    const { id } = request.params as { id: string };
    return TrainingService.getWorkoutById(id);
  });
}
