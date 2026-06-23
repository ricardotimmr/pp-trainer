import { useCallback, useEffect, useState } from 'react';

import type { PlannedWorkoutDto } from '@pp-trainer/shared';

import { fetchWorkouts } from '../api/trainingApi';

export type WorkoutsState =
  | { status: 'loading' }
  | { status: 'success'; workouts: PlannedWorkoutDto[] }
  | { status: 'error'; message: string };

export function useWorkouts(): WorkoutsState & { refresh: () => void } {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<WorkoutsState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchWorkouts()
      .then((workouts) => {
        if (!cancelled) setState({ status: 'success', workouts });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to load workouts',
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
