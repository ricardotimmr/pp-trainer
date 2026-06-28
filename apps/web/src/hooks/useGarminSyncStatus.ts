import { useCallback, useEffect, useState } from 'react';
import type { GarminSyncStatusDto } from '@pp-trainer/shared';

import { getGarminSyncStatus } from '../api/syncApi';

type GarminSyncStatusState =
  | { status: 'loading'; data?: GarminSyncStatusDto; refresh: () => void }
  | { status: 'success'; data: GarminSyncStatusDto; refresh: () => void }
  | { status: 'error'; data?: GarminSyncStatusDto; message: string; refresh: () => void };

export function useGarminSyncStatus(): GarminSyncStatusState {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
  const [state, setState] = useState<GarminSyncStatusState>({
    status: 'loading',
    refresh,
  });

  useEffect(() => {
    let cancelled = false;

    setState((previousState) => ({
      status: 'loading',
      data: 'data' in previousState ? previousState.data : undefined,
      refresh,
    }));

    getGarminSyncStatus()
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'success', data, refresh });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState((previousState) => ({
          status: 'error',
          data: 'data' in previousState ? previousState.data : undefined,
          message: error instanceof Error ? error.message : 'Could not load Garmin sync status',
          refresh,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [refresh, refreshKey]);

  return state;
}
