import cors from '@fastify/cors';
import Fastify from 'fastify';

import { getApiConfig, type ApiConfig } from './config/env.js';
import { setupErrorHandling } from './errors/errorHandler.js';

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

  return app;
}
