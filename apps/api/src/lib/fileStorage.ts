import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export async function ensureStorageDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function writeImportFile(
  dir: string,
  ext: string,
  buffer: Buffer,
): Promise<{ storedPath: string; fileName: string }> {
  const fileName = `${randomUUID()}.${ext}`;
  const storedPath = join(dir, fileName);
  await writeFile(storedPath, buffer);
  return { storedPath, fileName };
}
