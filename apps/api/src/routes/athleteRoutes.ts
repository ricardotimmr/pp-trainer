import type { FastifyInstance } from 'fastify';

import * as AthleteService from '../services/AthleteService.js';

export async function athleteRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/athlete/profile', async () => {
    return AthleteService.getAthleteSettings();
  });
}
