import { useEffect, useState } from 'react';

import type { TrainingZoneSetDto } from '@pp-trainer/shared';

import { fetchAthleteSettings } from '../api/athleteApi';

type ZonesState =
  | { status: 'loading' }
  | { status: 'success'; zoneSets: TrainingZoneSetDto[] }
  | { status: 'error' };

export function useTrainingZones(): ZonesState {
  const [state, setState] = useState<ZonesState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetchAthleteSettings()
      .then((settings) => {
        if (!cancelled) setState({ status: 'success', zoneSets: settings.trainingZoneSets });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
