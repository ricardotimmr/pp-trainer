import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AthleteProfile, SyncJob } from '@prisma/client';
import type { ApiConfig } from '../../config/env.js';
import type { GarminSyncResult } from '../../services/GarminSyncService.js';
import type { SyncHistoryResponseDto } from '@pp-trainer/shared';

vi.mock('../../lib/prisma.js', () => ({ prisma: {}, disconnectPrisma: vi.fn() }));
vi.mock('../../config/env.js', () => ({ getApiConfig: vi.fn() }));
vi.mock('../../repositories/AthleteRepository.js');
vi.mock('../../services/GarminSyncService.js');
vi.mock('../../services/StravaSyncService.js');
vi.mock('../../services/SyncJobService.js');

const { getApiConfig }      = await import('../../config/env.js');
const AthleteRepository     = await import('../../repositories/AthleteRepository.js');
const GarminSyncService     = await import('../../services/GarminSyncService.js');
const StravaSyncService     = await import('../../services/StravaSyncService.js');
const SyncJobService        = await import('../../services/SyncJobService.js');

import { setupErrorHandling } from '../../errors/errorHandler.js';
import { syncRoutes }         from '../../routes/syncRoutes.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

const PROFILE_ID = 'profile-abc';

function buildApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(syncRoutes);
  return app;
}

function makeSyncJob(overrides: Partial<SyncJob> = {}): SyncJob {
  return {
    id: 'sync-job-1',
    createdAt: new Date('2024-03-15T08:00:00Z'),
    updatedAt: new Date('2024-03-15T08:01:00Z'),
    athleteProfileId: PROFILE_ID,
    source: 'GarminUnofficial',
    status: 'Completed',
    startedAt: new Date('2024-03-15T08:00:00Z'),
    completedAt: new Date('2024-03-15T08:01:00Z'),
    activitiesFound: 3,
    activitiesImported: 3,
    activitiesSkipped: 0,
    healthDaysFound: 1,
    healthDaysImported: 1,
    errorMessage: null,
    ...overrides,
  };
}

const mockHistory = { jobs: [makeSyncJob()], total: 1 };

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(getApiConfig).mockReturnValue({
    garminEmail: 'test@example.com',
    garminPassword: 'pass',
    stravaClientId: 'client-id',
    stravaClientSecret: 'secret',
    stravaRedirectUri: 'http://localhost:3000/api/connections/strava/callback',
    webOrigin: 'http://localhost:5173',
    port: 3001,
    nodeEnv: 'test',
    databaseUrl: 'postgresql://test',
  } as unknown as ApiConfig);

  vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue({
    id: PROFILE_ID,
  } as unknown as AthleteProfile);

  vi.mocked(GarminSyncService.sync).mockResolvedValue({ syncJob: makeSyncJob() } as GarminSyncResult);
  vi.mocked(StravaSyncService.sync).mockResolvedValue(makeSyncJob({ source: 'Strava' }));
  vi.mocked(SyncJobService.getSyncHistory).mockResolvedValue(mockHistory as unknown as SyncHistoryResponseDto);
});

// ── GET /api/sync/history ─────────────────────────────────────────────────────

describe('GET /api/sync/history', () => {
  it('returns full history when no source filter', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/sync/history' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.jobs).toHaveLength(1);
    expect(SyncJobService.getSyncHistory).toHaveBeenCalledWith(PROFILE_ID);
  });

  it('filters by source when valid source param provided', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/sync/history?source=garmin_unofficial' });
    expect(res.statusCode).toBe(200);
    expect(SyncJobService.getSyncHistory).toHaveBeenCalledWith(PROFILE_ID, 'GarminUnofficial');
  });

  it('returns 400 for invalid source value', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/sync/history?source=InvalidSource' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('BAD_REQUEST');
  });

  it('returns 404 when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/sync/history' });
    expect(res.statusCode).toBe(404);
  });
});

// ── POST /api/sync/garmin ─────────────────────────────────────────────────────

describe('POST /api/sync/garmin', () => {
  it('triggers Garmin sync with empty body and returns syncJob', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/api/sync/garmin', body: {} });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('Completed');
    expect(GarminSyncService.sync).toHaveBeenCalledWith({});
  });

  it('passes since date param to service', async () => {
    const app = buildApp();
    await app.inject({
      method: 'POST', url: '/api/sync/garmin',
      body: { since: '2024-03-01T00:00:00Z' },
    });
    expect(GarminSyncService.sync).toHaveBeenCalledWith(
      expect.objectContaining({ since: new Date('2024-03-01T00:00:00Z') }),
    );
  });

  it('passes days, mode, forceImport, mfaCode params to service', async () => {
    const app = buildApp();
    await app.inject({
      method: 'POST', url: '/api/sync/garmin',
      body: { days: 7, mode: 'activities', forceImport: true, mfaCode: '123456' },
    });
    expect(GarminSyncService.sync).toHaveBeenCalledWith(
      expect.objectContaining({ days: 7, mode: 'activities', forceImport: true, mfaCode: '123456' }),
    );
  });

  it('returns 400 for invalid since date string', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST', url: '/api/sync/garmin',
      body: { since: 'not-a-date' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('BAD_REQUEST');
  });

  it('ignores invalid mode value', async () => {
    const app = buildApp();
    await app.inject({ method: 'POST', url: '/api/sync/garmin', body: { mode: 'invalid' } });
    expect(GarminSyncService.sync).toHaveBeenCalledWith({});
  });
});

// ── POST /api/sync/strava ─────────────────────────────────────────────────────

describe('POST /api/sync/strava', () => {
  it('triggers Strava sync and returns the SyncJob', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/api/sync/strava', body: {} });
    expect(res.statusCode).toBe(200);
    expect(res.json().source).toBe('Strava');
    expect(StravaSyncService.sync).toHaveBeenCalledWith({});
  });

  it('passes forceImport: true to service', async () => {
    const app = buildApp();
    await app.inject({ method: 'POST', url: '/api/sync/strava', body: { forceImport: true } });
    expect(StravaSyncService.sync).toHaveBeenCalledWith({ forceImport: true });
  });

  it('returns 401 when no Strava connection exists', async () => {
    const { ApiError } = await import('../../errors/ApiError.js');
    vi.mocked(StravaSyncService.sync).mockRejectedValue(ApiError.unauthorized('No Strava connection found'));
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/api/sync/strava', body: {} });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
  });
});

// ── GET /api/sync/status/garmin ───────────────────────────────────────────────

describe('GET /api/sync/status/garmin', () => {
  it('returns configured: true and last sync when profile exists and credentials set', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/sync/status/garmin' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.configured).toBe(true);
    expect(body.lastSync).not.toBeNull();
  });

  it('returns configured: false when garminEmail not set', async () => {
    vi.mocked(getApiConfig).mockReturnValue({
      garminEmail: undefined,
      garminPassword: undefined,
      webOrigin: 'http://localhost:5173',
    } as unknown as ApiConfig);
    vi.mocked(SyncJobService.getSyncHistory).mockResolvedValue({ jobs: [], total: 0 } as unknown as SyncHistoryResponseDto);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/sync/status/garmin' });
    expect(res.statusCode).toBe(200);
    expect(res.json().configured).toBe(false);
  });

  it('returns configured: false and lastSync: null when no profile', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/sync/status/garmin' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.configured).toBe(false);
    expect(body.lastSync).toBeNull();
  });

  it('returns lastSync: null when no sync history exists', async () => {
    vi.mocked(SyncJobService.getSyncHistory).mockResolvedValue({ jobs: [], total: 0 } as unknown as SyncHistoryResponseDto);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/sync/status/garmin' });
    expect(res.statusCode).toBe(200);
    expect(res.json().lastSync).toBeNull();
  });
});
