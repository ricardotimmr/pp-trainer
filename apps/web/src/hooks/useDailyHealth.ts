import type { DailyHealthSummaryDto } from '@pp-trainer/shared';

import { getDailyHealth } from '../api/healthApi';
import { useHealthRangeData, type HealthDataState, type HealthRange } from './useHealthRange';

export function useDailyHealth(range: HealthRange): HealthDataState<DailyHealthSummaryDto> {
  return useHealthRangeData(range, getDailyHealth, 'Failed to load daily health data');
}
