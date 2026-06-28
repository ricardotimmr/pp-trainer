import type { StravaConnectionStatusDto } from '@pp-trainer/shared';

import { apiFetch } from './apiClient';

type StravaAuthorizeResponse = {
  authUrl: string;
};

export async function getStravaConnection(): Promise<StravaConnectionStatusDto> {
  return apiFetch<StravaConnectionStatusDto>('/api/connections/strava');
}

export async function startStravaAuthorize(): Promise<string> {
  const response = await apiFetch<StravaAuthorizeResponse>('/api/connections/strava/authorize', {
    method: 'POST',
  });
  return response.authUrl;
}

export async function disconnectStrava(): Promise<void> {
  await apiFetch<void>('/api/connections/strava', {
    method: 'DELETE',
  });
}
