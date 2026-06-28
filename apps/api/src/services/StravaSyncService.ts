import type { SyncJob } from '@prisma/client';

import { ApiError } from '../errors/ApiError.js';
import { mapStravaActivity, StravaActivityRawSchema } from '../import/mappers/StravaActivityMapper.js';
import type { StravaActivityRaw } from '../import/mappers/StravaActivityMapper.js';
import { runImportPipeline } from '../import/pipeline/runImportPipeline.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as DataSourceConnectionRepository from '../repositories/DataSourceConnectionRepository.js';
import * as StravaOAuthService from './StravaOAuthService.js';
import * as SyncJobService from './SyncJobService.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type StravaSyncParams = {
  forceImport?: boolean;
};

// ── Strava API fetch ──────────────────────────────────────────────────────────

async function fetchActivitiesPage(
  accessToken: string,
  after: number,
  page: number,
): Promise<StravaActivityRaw[]> {
  const url = new URL('https://www.strava.com/api/v3/athlete/activities');
  url.searchParams.set('after',    String(after));
  url.searchParams.set('per_page', '100');
  url.searchParams.set('page',     String(page));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Strava API error (${res.status}): ${text.slice(0, 200)}`);
  }

  const raw = await res.json() as unknown[];
  return raw.map((item) => StravaActivityRawSchema.parse(item));
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sync(params: StravaSyncParams = {}): Promise<SyncJob> {
  let connection = await StravaOAuthService.getConnection();
  if (!connection) {
    throw ApiError.unauthorized(
      'No Strava connection found. Connect via POST /api/connections/strava/authorize',
    );
  }

  // Refresh token if expired
  if (connection.expiresAt != null && connection.expiresAt <= new Date()) {
    connection = await StravaOAuthService.refreshAccessToken(connection);
  }

  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) throw new Error('No athlete profile found');

  const syncJob = await SyncJobService.startSyncJob(profile.id, 'Strava');

  try {
    const defaultAfter = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const after = Math.floor(
      (connection.lastSyncedItemAt?.getTime() ?? defaultAfter) / 1000,
    );

    let page = 1;
    let activitiesFound    = 0;
    let activitiesImported = 0;
    let activitiesSkipped  = 0;
    let mostRecentStart: Date | null = null;

    while (true) {
      const batch = await fetchActivitiesPage(connection.accessToken!, after, page);
      if (batch.length === 0) break;

      activitiesFound += batch.length;

      for (const raw of batch) {
        const parsed = mapStravaActivity(raw);

        if (mostRecentStart == null || parsed.startTime > mostRecentStart) {
          mostRecentStart = parsed.startTime;
        }

        const result = await runImportPipeline({
          athleteProfileId: profile.id,
          source:           'Strava',
          input:            parsed,
          externalId:       parsed.externalId,
          syncJobId:        syncJob.id,
          forceImport:      params.forceImport ?? false,
        });

        if (result.status === 'success') activitiesImported++;
        else activitiesSkipped++;
      }

      if (batch.length < 100) break;
      page++;
    }

    await DataSourceConnectionRepository.upsertConnection(profile.id, 'Strava', {
      lastSyncedAt: new Date(),
      ...(mostRecentStart != null && { lastSyncedItemAt: mostRecentStart }),
    });

    return SyncJobService.completeSyncJob(syncJob.id, {
      activitiesFound,
      activitiesImported,
      activitiesSkipped,
      healthDaysFound:    0,
      healthDaysImported: 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return SyncJobService.failSyncJob(syncJob.id, message);
  }
}
