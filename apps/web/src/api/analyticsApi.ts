import type { SportDistributionDto, WeeklySummaryDto } from '@pp-trainer/shared';

import { apiFetch } from './apiClient';

export async function fetchWeeklySummary(weeks = 8): Promise<WeeklySummaryDto[]> {
  const params = new URLSearchParams({ weeks: String(weeks) });
  return apiFetch<WeeklySummaryDto[]>(`/api/analytics/weekly-summary?${params.toString()}`);
}

export async function fetchSportDistribution(
  from: string,
  to: string,
): Promise<SportDistributionDto[]> {
  const params = new URLSearchParams({ from, to });
  return apiFetch<SportDistributionDto[]>(
    `/api/analytics/sport-distribution?${params.toString()}`,
  );
}
