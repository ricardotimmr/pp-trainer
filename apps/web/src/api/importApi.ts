import type { ImportResultDto } from '@pp-trainer/shared';

import { apiFetch } from './apiClient';

export async function uploadActivityFile(file: File): Promise<ImportResultDto> {
  const formData = new FormData();
  formData.append('file', file);
  // 422 = failed pipeline (parser stub) — still a valid ImportResultDto, not an error
  return apiFetch<ImportResultDto>('/api/imports/activity-file', {
    method: 'POST',
    body: formData,
    acceptedStatuses: [422],
  });
}

export async function importActivityJson(payload: unknown): Promise<ImportResultDto> {
  return apiFetch<ImportResultDto>('/api/imports/activity-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    acceptedStatuses: [422],
  });
}
