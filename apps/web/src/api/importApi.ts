import type { ImportDetailDto, ImportListResponseDto, ImportResultDto } from '@pp-trainer/shared';

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

export async function getImportHistory(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ImportListResponseDto> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  return apiFetch<ImportListResponseDto>(`/api/imports${qs ? `?${qs}` : ''}`);
}

export async function getImportDetail(importId: string): Promise<ImportDetailDto> {
  return apiFetch<ImportDetailDto>(`/api/imports/${encodeURIComponent(importId)}`);
}
