import type { DataSourceConnection, Prisma } from '@prisma/client';

import { getApiConfig } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as DataSourceConnectionRepository from '../repositories/DataSourceConnectionRepository.js';

// ── Strava API endpoints ──────────────────────────────────────────────────────

const STRAVA_AUTH_URL   = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL  = 'https://www.strava.com/oauth/token';
const STRAVA_DEAUTH_URL = 'https://www.strava.com/oauth/deauthorize';

// ── Internal types ────────────────────────────────────────────────────────────

type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireStravaConfig() {
  const config = getApiConfig();
  if (!config.stravaClientId || !config.stravaClientSecret) {
    throw ApiError.serviceUnavailable('Strava integration is not configured on this server');
  }
  return {
    clientId:     config.stravaClientId,
    clientSecret: config.stravaClientSecret,
    redirectUri:  config.stravaRedirectUri,
  };
}

async function resolveAthleteId(): Promise<string> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) throw new Error('No athlete profile found');
  return profile.id;
}

async function postStravaToken(body: Record<string, string>): Promise<StravaTokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Strava token request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<StravaTokenResponse>;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getAuthUrl(): string {
  const { clientId, redirectUri } = requireStravaConfig();
  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope:         'read,activity:read_all',
  });
  return `${STRAVA_AUTH_URL}?${params}`;
}

export async function exchangeCode(code: string): Promise<DataSourceConnection> {
  const { clientId, clientSecret } = requireStravaConfig();
  const athleteProfileId = await resolveAthleteId();

  const data = await postStravaToken({
    client_id:     clientId,
    client_secret: clientSecret,
    code,
    grant_type:    'authorization_code',
  });

  const athlete = data.athlete;
  const athleteName = athlete
    ? [athlete.firstname, athlete.lastname].filter(Boolean).join(' ')
    : undefined;

  return DataSourceConnectionRepository.upsertConnection(athleteProfileId, 'Strava', {
    isActive:       true,
    accessToken:    data.access_token,
    refreshToken:   data.refresh_token,
    expiresAt:      new Date(data.expires_at * 1000),
    externalUserId: athlete?.id != null ? String(athlete.id) : null,
    metadata:       athleteName ? { athleteName } as Prisma.InputJsonObject : undefined,
  });
}

export async function refreshAccessToken(
  connection: DataSourceConnection,
): Promise<DataSourceConnection> {
  const { clientId, clientSecret } = requireStravaConfig();
  const athleteProfileId = await resolveAthleteId();

  const data = await postStravaToken({
    client_id:     clientId,
    client_secret: clientSecret,
    refresh_token: connection.refreshToken!,
    grant_type:    'refresh_token',
  });

  return DataSourceConnectionRepository.upsertConnection(athleteProfileId, 'Strava', {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    new Date(data.expires_at * 1000),
  });
}

export async function getConnection(): Promise<DataSourceConnection | null> {
  const athleteProfileId = await resolveAthleteId();
  return DataSourceConnectionRepository.findConnection(athleteProfileId, 'Strava');
}

export async function disconnect(): Promise<void> {
  const athleteProfileId = await resolveAthleteId();
  const connection = await DataSourceConnectionRepository.findConnection(athleteProfileId, 'Strava');

  if (connection?.accessToken) {
    await fetch(`${STRAVA_DEAUTH_URL}?access_token=${connection.accessToken}`, {
      method: 'POST',
    }).catch(() => {});
  }

  await DataSourceConnectionRepository.deleteConnection(athleteProfileId, 'Strava');
}
