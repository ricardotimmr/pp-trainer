export type ApiConfig = {
  host: string;
  port: number;
  webOrigin: string;
  nodeEnv: 'development' | 'test' | 'production';
  importMaxFileSizeMb: number;
  importStoragePath: string;
};

const validNodeEnvs = ['development', 'test', 'production'] as const;

function parsePort(rawPort: string | undefined): number {
  const fallbackPort = 3000;

  if (!rawPort) {
    return fallbackPort;
  }

  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`API_PORT must be an integer between 1 and 65535.`);
  }

  return port;
}

function parseNodeEnv(rawNodeEnv: string | undefined): ApiConfig['nodeEnv'] {
  const nodeEnv = rawNodeEnv ?? 'development';

  if (!validNodeEnvs.includes(nodeEnv as ApiConfig['nodeEnv'])) {
    throw new Error(`NODE_ENV must be one of: ${validNodeEnvs.join(', ')}.`);
  }

  return nodeEnv as ApiConfig['nodeEnv'];
}

export function getApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    host: env.API_HOST ?? '127.0.0.1',
    port: parsePort(env.API_PORT),
    webOrigin: env.WEB_ORIGIN ?? 'http://127.0.0.1:5173',
    nodeEnv: parseNodeEnv(env.NODE_ENV),
    importMaxFileSizeMb: Number(env.IMPORT_MAX_FILE_SIZE_MB ?? 20),
    importStoragePath: env.IMPORT_STORAGE_PATH ?? './storage/imports',
  };
}
