import { useEffect, useState } from 'react';

import type { PlannedWorkoutDto } from '@pp-trainer/shared';

import { fetchWorkoutById } from '../api/trainingApi';

export type WorkoutState =
  | { status: 'loading' }
  | { status: 'success'; workout: PlannedWorkoutDto }
  | { status: 'error'; message: string };

export function useWorkout(id: string): WorkoutState {
  const [state, setState] = useState<WorkoutState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchWorkoutById(id)
      .then((workout) => {
        if (!cancelled) setState({ status: 'success', workout });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to load workout',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
