import { DataSourceTypeSchema } from '@pp-trainer/shared';
import type { FastifyInstance } from 'fastify';

import { ApiError } from '../errors/ApiError.js';
import { getApiConfig } from '../config/env.js';
import { DTO_TO_PRISMA_DATA_SOURCE_TYPE_MAP } from '../mappers/enumMaps.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as GarminSyncService from '../services/GarminSyncService.js';
import type { GarminSyncMode } from '../services/GarminSyncService.js';
import * as StravaSyncService from '../services/StravaSyncService.js';
import * as SyncJobService from '../services/SyncJobService.js';

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/sync/history', async (request) => {
    const query = request.query as { source?: unknown };

    const profile = await AthleteRepository.findFirstAthleteProfile();
    if (!profile) throw ApiError.notFound('Athlete profile not found');

    if (query.source == null) {
      return SyncJobService.getSyncHistory(profile.id);
    }

    const parsed = DataSourceTypeSchema.safeParse(query.source);
    if (!parsed.success) {
      throw ApiError.badRequest(`Invalid source value: '${String(query.source)}'`);
    }

    const prismaSource = DTO_TO_PRISMA_DATA_SOURCE_TYPE_MAP[parsed.data];
    return SyncJobService.getSyncHistory(profile.id, prismaSource);
  });

  app.post('/api/sync/garmin', async (request) => {
    const body = (request.body ?? {}) as {
      since?: unknown;
      days?: unknown;
      forceImport?: unknown;
      mode?: unknown;
      mfaCode?: unknown;
    };

    const params: Parameters<typeof GarminSyncService.sync>[0] = {};

    if (typeof body.since === 'string' && body.since) {
      const d = new Date(body.since);
      if (!Number.isNaN(d.getTime())) params.since = d;
      else throw ApiError.badRequest('since must be a valid ISO date string');
    }
    if (typeof body.days === 'number' && body.days > 0) {
      params.days = Math.floor(body.days);
    }
    if (typeof body.forceImport === 'boolean') {
      params.forceImport = body.forceImport;
    }
    if (body.mode === 'activities' || body.mode === 'health' || body.mode === 'all') {
      params.mode = body.mode as GarminSyncMode;
    }
    if (typeof body.mfaCode === 'string' && body.mfaCode) {
      params.mfaCode = body.mfaCode;
    }

    const { syncJob } = await GarminSyncService.sync(params);
    return syncJob;
  });

  app.post('/api/sync/strava', async (request) => {
    const body = (request.body ?? {}) as { forceImport?: unknown };
    const params: Parameters<typeof StravaSyncService.sync>[0] = {};
    if (typeof body.forceImport === 'boolean') {
      params.forceImport = body.forceImport;
    }
    return StravaSyncService.sync(params);
  });

  app.get('/api/sync/status/garmin', async () => {
    const profile = await AthleteRepository.findFirstAthleteProfile();
    if (!profile) return { configured: false, lastSync: null };

    const config = getApiConfig();
    const configured = !!(config.garminEmail && config.garminPassword);

    const history = await SyncJobService.getSyncHistory(profile.id, 'GarminUnofficial');
    const lastSync = history.jobs[0] ?? null;

    return { configured, lastSync };
  });
}
