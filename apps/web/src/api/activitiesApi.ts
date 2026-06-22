import type { ActivitiesResponseDto, ActivitySummaryDto } from '@pp-trainer/shared';
import { apiFetch } from './apiClient';

export async function fetchActivities(): Promise<ActivitySummaryDto[]> {
  const response = await apiFetch<ActivitiesResponseDto>('/api/activities');
  return response.activities;
}
