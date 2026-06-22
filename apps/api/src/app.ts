import cors from '@fastify/cors';
import Fastify from 'fastify';

import { getApiConfig, type ApiConfig } from './config/env.js';
import { setupErrorHandling } from './errors/errorHandler.js';
import { activityRoutes } from './routes/activityRoutes.js';
import { athleteRoutes } from './routes/athleteRoutes.js';
import { importRoutes } from './routes/importRoutes.js';
import { performanceRoutes } from './routes/performanceRoutes.js';
import { trainingRoutes } from './routes/trainingRoutes.js';

export async function buildApp(config: ApiConfig = getApiConfig()) {
  const app = Fastify({
    logger:
      config.nodeEnv === 'test'
        ? false
        : {
            level: 'info',
          },
  });

  setupErrorHandling(app);

  await app.register(cors, {
    origin: config.webOrigin,
  });

  app.get('/api/health', async () => ({
    status: 'ok',
    service: 'pp-trainer-api',
  }));

  await app.register(athleteRoutes);
  await app.register(activityRoutes);
  await app.register(trainingRoutes);
  await app.register(performanceRoutes);
  await app.register(importRoutes);

  return app;
}
