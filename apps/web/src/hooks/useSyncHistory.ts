import { useCallback, useEffect, useState } from 'react';
import type { DataSourceTypeDto, SyncJobDto } from '@pp-trainer/shared';

import { getSyncHistory } from '../api/syncApi';

type SyncHistoryState =
  | { status: 'loading'; jobs: SyncJobDto[]; refresh: () => void }
  | { status: 'success'; jobs: SyncJobDto[]; refresh: () => void }
  | { status: 'error'; jobs: SyncJobDto[]; message: string; refresh: () => void };

export function useSyncHistory(source?: DataSourceTypeDto): SyncHistoryState {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
  const [state, setState] = useState<SyncHistoryState>({
    status: 'loading',
    jobs: [],
    refresh,
  });

  useEffect(() => {
    let cancelled = false;

    setState((previousState) => ({
      status: 'loading',
      jobs: previousState.jobs,
      refresh,
    }));

    getSyncHistory(source)
      .then((jobs) => {
        if (cancelled) return;
        setState({ status: 'success', jobs, refresh });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState((previousState) => ({
          status: 'error',
          jobs: previousState.jobs,
          message: error instanceof Error ? error.message : 'Could not load sync history',
          refresh,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [refresh, refreshKey, source]);

  return state;
}
