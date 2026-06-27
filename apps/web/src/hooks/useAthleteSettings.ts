import { useCallback, useEffect, useRef, useState } from 'react';

import type { AthleteSettingsDto } from '@pp-trainer/shared';

import { fetchAthleteSettings } from '../api/athleteApi';

export type AthleteSettingsState =
  | { status: 'loading' }
  | { status: 'success'; data: AthleteSettingsDto }
  | { status: 'error'; message: string };

export function useAthleteSettings(): AthleteSettingsState & { refresh: () => void } {
  const [state, setState] = useState<AthleteSettingsState>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  const isInitial = useRef(true);

  useEffect(() => {
    let cancelled = false;
    if (isInitial.current) {
      isInitial.current = false;
      setState({ status: 'loading' });
    }
    fetchAthleteSettings()
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to load athlete settings',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { ...state, refresh };
}
