import { loadLocalEnvFiles } from './config/loadEnv.js';

loadLocalEnvFiles();

const { buildApp } = await import('./app.js');
const { getApiConfig } = await import('./config/env.js');

const config = getApiConfig();
const app = await buildApp(config);

const shutdown = async (signal: NodeJS.Signals) => {
  app.log.info({ signal }, 'Shutting down API server');
  await app.close();
};

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

try {
  await app.listen({
    host: config.host,
    port: config.port,
  });
} catch (error) {
  app.log.error(error, 'Failed to start API server');
  process.exit(1);
}
