import type { SleepSessionDto } from '@pp-trainer/shared';

import { getSleepSessions } from '../api/healthApi';
import { useHealthRangeData, type HealthDataState, type HealthRange } from './useHealthRange';

export function useSleepSessions(range: HealthRange): HealthDataState<SleepSessionDto> {
  return useHealthRangeData(range, getSleepSessions, 'Failed to load sleep data');
}
