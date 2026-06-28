import type { HrvStatusDto } from '@pp-trainer/shared';

import { getHrvStatus } from '../api/healthApi';
import { useHealthRangeData, type HealthDataState, type HealthRange } from './useHealthRange';

export function useHrvStatus(range: HealthRange): HealthDataState<HrvStatusDto> {
  return useHealthRangeData(range, getHrvStatus, 'Failed to load HRV data');
}
