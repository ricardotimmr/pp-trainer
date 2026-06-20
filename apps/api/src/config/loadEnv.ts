import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

const envFileCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
];

export function loadLocalEnvFiles() {
  const loadedFiles = new Set<string>();

  for (const envFilePath of envFileCandidates) {
    if (loadedFiles.has(envFilePath) || !existsSync(envFilePath)) {
      continue;
    }

    loadEnvFile(envFilePath);
    loadedFiles.add(envFilePath);
  }
}
