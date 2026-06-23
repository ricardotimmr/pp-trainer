import { useState } from 'react';
import type { ImportResultDto } from '@pp-trainer/shared';

import { importActivityJson, uploadActivityFile } from '../api/importApi';

export type FileResult = {
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'duplicate';
  importId?: string;
  activityId?: string;
  message?: string;
};

export type ImportState =
  | { status: 'idle' }
  | { status: 'files-uploading'; results: FileResult[]; completedCount: number }
  | { status: 'files-done'; results: FileResult[] }
  | { status: 'json-uploading' }
  | { status: 'json-success'; importId: string; activityId: string }
  | { status: 'json-error'; message: string }
  | { status: 'json-duplicate'; importId: string; existingActivityId: string };

export function useImport() {
  const [state, setState] = useState<ImportState>({ status: 'idle' });

  async function startFileUploads(files: File[]): Promise<void> {
    if (files.length === 0) return;

    const initial: FileResult[] = files.map((f) => ({ name: f.name, status: 'pending' }));
    setState({ status: 'files-uploading', results: initial, completedCount: 0 });

    const results: FileResult[] = [...initial];

    for (let i = 0; i < files.length; i++) {
      results[i] = { ...results[i], status: 'uploading' };
      setState({ status: 'files-uploading', results: [...results], completedCount: i });

      try {
        const dto = await uploadActivityFile(files[i]);
        if (dto.status === 'success' && dto.activityId != null) {
          results[i] = {
            name: results[i].name,
            status: 'success',
            importId: dto.importId,
            activityId: dto.activityId,
          };
        } else if (dto.status === 'duplicate' && dto.activityId != null) {
          results[i] = {
            name: results[i].name,
            status: 'duplicate',
            importId: dto.importId,
            activityId: dto.activityId,
          };
        } else {
          results[i] = {
            name: results[i].name,
            status: 'error',
            message: dto.errors[0] ?? 'Import failed',
          };
        }
      } catch (err) {
        results[i] = {
          name: results[i].name,
          status: 'error',
          message: err instanceof Error ? err.message : 'Upload failed',
        };
      }

      setState({ status: 'files-uploading', results: [...results], completedCount: i + 1 });
    }

    setState({ status: 'files-done', results });
  }

  function startJsonImport(payload: unknown): void {
    setState({ status: 'json-uploading' });
    importActivityJson(payload)
      .then((dto: ImportResultDto) => {
        if (dto.status === 'success' && dto.activityId != null) {
          setState({ status: 'json-success', importId: dto.importId, activityId: dto.activityId });
        } else if (dto.status === 'duplicate' && dto.activityId != null) {
          setState({
            status: 'json-duplicate',
            importId: dto.importId,
            existingActivityId: dto.activityId,
          });
        } else {
          setState({ status: 'json-error', message: dto.errors[0] ?? 'Import failed' });
        }
      })
      .catch((err: unknown) => {
        setState({
          status: 'json-error',
          message: err instanceof Error ? err.message : 'Upload failed',
        });
      });
  }

  function reset(): void {
    setState({ status: 'idle' });
  }

  return { state, startFileUploads, startJsonImport, reset };
}
