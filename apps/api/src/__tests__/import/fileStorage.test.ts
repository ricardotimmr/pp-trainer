import { mkdtemp, rm, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';

import { ensureStorageDir, writeImportFile } from '../../lib/fileStorage.js';

let tmpDir: string | null = null;

afterEach(async () => {
  if (tmpDir != null) {
    await rm(tmpDir, { recursive: true, force: true });
    tmpDir = null;
  }
});

describe('ensureStorageDir', () => {
  it('creates a directory that does not exist', async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    const targetDir = join(tmpDir, 'imports', 'nested');
    await ensureStorageDir(targetDir);
    const s = await stat(targetDir);
    expect(s.isDirectory()).toBe(true);
  });

  it('does not throw if directory already exists', async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    await ensureStorageDir(tmpDir);
    await expect(ensureStorageDir(tmpDir)).resolves.not.toThrow();
  });
});

describe('writeImportFile', () => {
  it('writes buffer to file with UUID name and correct extension', async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    const buffer = Buffer.from('FIT_DATA_BYTES');

    const { storedPath, fileName } = await writeImportFile(tmpDir, 'fit', buffer);

    expect(fileName).toMatch(/^[0-9a-f-]{36}\.fit$/);
    expect(storedPath).toContain(tmpDir);

    const written = await readFile(storedPath);
    expect(written).toEqual(buffer);
  });

  it('generates unique filenames for each call', async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    const buf = Buffer.from('data');

    const { fileName: name1 } = await writeImportFile(tmpDir, 'gpx', buf);
    const { fileName: name2 } = await writeImportFile(tmpDir, 'gpx', buf);

    expect(name1).not.toBe(name2);
  });

  it('preserves binary content exactly', async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    const buffer = Buffer.from([0x00, 0x0e, 0x04, 0x02, 0x80, 0x00]);

    const { storedPath } = await writeImportFile(tmpDir, 'fit', buffer);
    const written = await readFile(storedPath);

    expect(written.equals(buffer)).toBe(true);
  });
});
