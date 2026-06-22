import type { FastifyInstance } from 'fastify';

import * as PerformanceService from '../services/PerformanceService.js';

export async function performanceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/performance', async () => {
    return PerformanceService.getPerformanceStats();
  });
}
