import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

import { defineConfig, env } from 'prisma/config';

const envFilePath = resolve(process.cwd(), '.env');

if (existsSync(envFilePath)) {
  loadEnvFile(envFilePath);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
