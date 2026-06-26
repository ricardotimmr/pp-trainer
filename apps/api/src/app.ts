import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';

import { getApiConfig, type ApiConfig } from './config/env.js';
import { setupErrorHandling } from './errors/errorHandler.js';
import { ensureStorageDir } from './lib/fileStorage.js';
import { activityRoutes } from './routes/activityRoutes.js';
import { analyticsRoutes } from './routes/analyticsRoutes.js';
import { aiRoutes } from './routes/aiRoutes.js';
import { athleteRoutes } from './routes/athleteRoutes.js';
import { contextRoutes } from './routes/contextRoutes.js';
import { importRoutes } from './routes/importRoutes.js';
import { performanceRoutes } from './routes/performanceRoutes.js';
import { trainingRoutes } from './routes/trainingRoutes.js';
import { trainingZoneRoutes } from './routes/trainingZoneRoutes.js';

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
    origin: [config.webOrigin, config.webOrigin.replace('127.0.0.1', 'localhost')],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(multipart, {
    limits: { fileSize: config.importMaxFileSizeMb * 1024 * 1024 },
  });

  await ensureStorageDir(config.importStoragePath);

  app.get('/api/health', async () => ({
    status: 'ok',
    service: 'pp-trainer-api',
  }));

  await app.register(athleteRoutes);
  await app.register(trainingZoneRoutes);
  await app.register(activityRoutes);
  await app.register(analyticsRoutes);
  await app.register(trainingRoutes);
  await app.register(performanceRoutes);
  await app.register(importRoutes);
  await app.register(contextRoutes);
  await app.register(aiRoutes);

  return app;
}
