import type {
  DailyHealthResponseDto,
  DailyHealthSummaryDto,
  HrvStatusDto,
  HrvStatusResponseDto,
  SleepSessionDto,
  SleepSessionResponseDto,
} from '@pp-trainer/shared';

import { apiFetch } from './apiClient';

function buildRangeQuery(from: string, to: string): string {
  return new URLSearchParams({ from, to }).toString();
}

export async function getDailyHealth(from: string, to: string): Promise<DailyHealthSummaryDto[]> {
  const response = await apiFetch<DailyHealthResponseDto>(`/api/health/daily?${buildRangeQuery(from, to)}`);
  return response.days;
}

export async function getSleepSessions(from: string, to: string): Promise<SleepSessionDto[]> {
  const response = await apiFetch<SleepSessionResponseDto>(`/api/health/sleep?${buildRangeQuery(from, to)}`);
  return response.sessions;
}

export async function getHrvStatus(from: string, to: string): Promise<HrvStatusDto[]> {
  const response = await apiFetch<HrvStatusResponseDto>(`/api/health/hrv?${buildRangeQuery(from, to)}`);
  return response.statuses;
}
