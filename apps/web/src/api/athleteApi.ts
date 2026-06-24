import type { AthleteSettingsDto } from '@pp-trainer/shared';

import { apiFetch } from './apiClient';

export async function fetchAthleteSettings(): Promise<AthleteSettingsDto> {
  return apiFetch<AthleteSettingsDto>('/api/athlete/profile');
}
