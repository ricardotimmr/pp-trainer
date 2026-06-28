import type {
  DataSourceTypeDto,
  GarminSyncStatusDto,
  SyncHistoryResponseDto,
  SyncJobDto,
} from '@pp-trainer/shared';

import { apiFetch } from './apiClient';

export async function getGarminSyncStatus(): Promise<GarminSyncStatusDto> {
  return apiFetch<GarminSyncStatusDto>('/api/sync/status/garmin');
}

export async function getSyncHistory(source?: DataSourceTypeDto): Promise<SyncJobDto[]> {
  const params = new URLSearchParams();
  if (source != null) params.set('source', source);
  const query = params.toString();
  const response = await apiFetch<SyncHistoryResponseDto>(`/api/sync/history${query ? `?${query}` : ''}`);
  return response.jobs;
}

export async function startGarminSync(): Promise<SyncJobDto> {
  return apiFetch<SyncJobDto>('/api/sync/garmin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'all' }),
  });
}

export async function startStravaSync(): Promise<SyncJobDto> {
  return apiFetch<SyncJobDto>('/api/sync/strava', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}
