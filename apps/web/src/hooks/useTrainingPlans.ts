import { useCallback, useEffect, useRef, useState } from 'react';

import type { TrainingPlanSummaryDto } from '@pp-trainer/shared';

import { fetchTrainingPlans } from '../api/trainingApi';

export type TrainingPlansState =
  | { status: 'loading' }
  | { status: 'success'; plans: TrainingPlanSummaryDto[] }
  | { status: 'error'; message: string };

export function useTrainingPlans(): TrainingPlansState & { refresh: () => void } {
  const [state, setState] = useState<TrainingPlansState>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  const isInitial = useRef(true);

  useEffect(() => {
    let cancelled = false;
    if (isInitial.current) {
      isInitial.current = false;
      setState({ status: 'loading' });
    }
    fetchTrainingPlans()
      .then((plans) => {
        if (!cancelled) setState({ status: 'success', plans });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to load training plans',
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
