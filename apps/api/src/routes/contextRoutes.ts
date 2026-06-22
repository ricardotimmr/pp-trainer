import type { FastifyInstance } from 'fastify';

import { ApiError } from '../errors/ApiError.js';
import * as AthleteContextService from '../services/AthleteContextService.js';

export async function contextRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/athlete/context', async () => {
    const context = await AthleteContextService.buildAthleteContext();
    if (!context) throw ApiError.notFound('Athlete profile not found');
    return { context };
  });

  app.post('/api/athlete/context/snapshot', async (_request, reply) => {
    const snapshot = await AthleteContextService.saveContextSnapshot();
    return reply.status(201).send(snapshot);
  });
}
