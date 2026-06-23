import { useCallback, useEffect, useState } from 'react';

import type { TrainingPlanDto } from '@pp-trainer/shared';

import { fetchCurrentWeekPlan } from '../api/trainingApi';

export type CurrentWeekPlanState =
  | { status: 'loading' }
  | { status: 'success'; plan: TrainingPlanDto | null }
  | { status: 'error'; message: string };

export function useCurrentWeekPlan(): CurrentWeekPlanState & { refresh: () => void } {
  const [state, setState] = useState<CurrentWeekPlanState>({ status: 'loading' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchCurrentWeekPlan()
      .then((response) => {
        if (!cancelled) setState({ status: 'success', plan: response.currentTrainingPlan });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to load training plan',
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
