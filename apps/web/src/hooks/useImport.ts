import { useState } from 'react';
import type { ImportResultDto } from '@pp-trainer/shared';

import { importActivityJson, uploadActivityFile } from '../api/importApi';

export type ImportState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'success'; importId: string; activityId: string }
  | { status: 'error'; message: string }
  | { status: 'duplicate'; importId: string; existingActivityId: string };

export function useImport() {
  const [state, setState] = useState<ImportState>({ status: 'idle' });

  function handleResult(dto: ImportResultDto): void {
    if (dto.status === 'success' && dto.activityId != null) {
      setState({ status: 'success', importId: dto.importId, activityId: dto.activityId });
    } else if (dto.status === 'duplicate' && dto.activityId != null) {
      setState({ status: 'duplicate', importId: dto.importId, existingActivityId: dto.activityId });
    } else {
      setState({ status: 'error', message: dto.errors[0] ?? 'Import failed' });
    }
  }

  function handleError(err: unknown): void {
    setState({ status: 'error', message: err instanceof Error ? err.message : 'Upload failed' });
  }

  function startFileUpload(file: File): void {
    setState({ status: 'uploading' });
    uploadActivityFile(file).then(handleResult).catch(handleError);
  }

  function startJsonImport(payload: unknown): void {
    setState({ status: 'uploading' });
    importActivityJson(payload).then(handleResult).catch(handleError);
  }

  function reset(): void {
    setState({ status: 'idle' });
  }

  return { state, startFileUpload, startJsonImport, reset };
}
