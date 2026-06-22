import { useEffect, useState } from 'react';
import { fetchActivities } from '../api/activitiesApi';
import { mapApiActivity } from '../api/mapApiActivity';
import type { Activity } from '../mock/prototypeData.types';

type ActivitiesApiState =
  | { status: 'loading' }
  | { status: 'success'; activities: Activity[] }
  | { status: 'error'; message: string };

export function useActivitiesApi(): ActivitiesApiState {
  const [state, setState] = useState<ActivitiesApiState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetchActivities()
      .then((dtos) => {
        if (!cancelled) {
          setState({ status: 'success', activities: dtos.map(mapApiActivity) });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : 'Failed to load activities';
          setState({ status: 'error', message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
