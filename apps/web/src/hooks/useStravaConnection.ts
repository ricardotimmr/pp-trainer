import { useCallback, useEffect, useState } from 'react';
import type { StravaConnectionStatusDto } from '@pp-trainer/shared';

import { getStravaConnection } from '../api/connectionApi';

type StravaConnectionState =
  | { status: 'loading'; data?: StravaConnectionStatusDto; refresh: () => void }
  | { status: 'success'; data: StravaConnectionStatusDto; refresh: () => void }
  | { status: 'error'; data?: StravaConnectionStatusDto; message: string; refresh: () => void };

export function useStravaConnection(): StravaConnectionState {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
  const [state, setState] = useState<StravaConnectionState>({
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

    getStravaConnection()
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'success', data, refresh });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState((previousState) => ({
          status: 'error',
          data: 'data' in previousState ? previousState.data : undefined,
          message: error instanceof Error ? error.message : 'Could not load Strava connection',
          refresh,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [refresh, refreshKey]);

  return state;
}
