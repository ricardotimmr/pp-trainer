import type { ActivitiesResponseDto, ActivityDetailDto, ActivitySummaryDto } from '@pp-trainer/shared';
import { apiFetch } from './apiClient';

export async function fetchActivities(): Promise<ActivitySummaryDto[]> {
  const response = await apiFetch<ActivitiesResponseDto>('/api/activities');
  return response.activities;
}

export async function fetchActivitiesForWeek(
  dateFrom: string,
  dateTo: string,
): Promise<ActivitySummaryDto[]> {
  const params = new URLSearchParams({ dateFrom, dateTo });
  const response = await apiFetch<ActivitiesResponseDto>(`/api/activities?${params.toString()}`);
  return response.activities;
}

export async function fetchActivityById(id: string): Promise<ActivityDetailDto> {
  return apiFetch<ActivityDetailDto>(`/api/activities/${encodeURIComponent(id)}`);
}
