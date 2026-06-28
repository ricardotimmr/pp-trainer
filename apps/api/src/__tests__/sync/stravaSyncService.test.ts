import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSourceConnection, SyncJob } from '@prisma/client';

vi.mock('../../lib/prisma.js', () => ({ prisma: {}, disconnectPrisma: vi.fn() }));
vi.mock('../../config/env.js', () => ({ getApiConfig: vi.fn() }));
vi.mock('../../repositories/AthleteRepository.js');
vi.mock('../../repositories/DataSourceConnectionRepository.js');
vi.mock('../../services/SyncJobService.js');
vi.mock('../../services/StravaOAuthService.js');
vi.mock('../../import/pipeline/runImportPipeline.js');

const AthleteRepository               = await import('../../repositories/AthleteRepository.js');
const DataSourceConnectionRepository  = await import('../../repositories/DataSourceConnectionRepository.js');
const SyncJobService                  = await import('../../services/SyncJobService.js');
const StravaOAuthService              = await import('../../services/StravaOAuthService.js');
const { runImportPipeline }           = await import('../../import/pipeline/runImportPipeline.js');
const StravaSyncService               = await import('../../services/StravaSyncService.js');

// ── Helpers ────────────────────────────────────────────────────────────────────

const PROFILE_ID = 'profile-abc';

function makeSyncJob(status: 'Running' | 'Completed' | 'Failed'): SyncJob {
  return {
    id: 'sync-job-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    athleteProfileId: PROFILE_ID,
    source: 'Strava',
    status,
    startedAt: new Date(),
    completedAt: null,
    activitiesFound: 0,
    activitiesImported: 0,
    activitiesSkipped: 0,
    healthDaysFound: 0,
    healthDaysImported: 0,
    errorMessage: null,
  };
}

function makeConnection(overrides: Partial<DataSourceConnection> = {}): DataSourceConnection {
  return {
    id: 'conn-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    athleteProfileId: PROFILE_ID,
    source: 'Strava',
    isActive: true,
    accessToken: 'access-token-abc',
    refreshToken: 'refresh-token-abc',
    expiresAt: new Date(Date.now() + 3600 * 1000),
    lastSyncedAt: null,
    lastSyncedItemAt: null,
    externalUserId: '9876543',
    username: null,
    password: null,
    metadata: { athleteName: 'Test Athlete' },
    ...overrides,
  } as DataSourceConnection;
}

function makeRawActivity(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 111222333,
    name: 'Morning Run',
    type: 'Run',
    start_date: '2024-03-15T07:00:00Z',
    moving_time: 3600,
    distance: 10000,
    total_elevation_gain: 50,
    average_heartrate: 145,
    average_speed: 2.778,
    kilojoules: 900,
    ...overrides,
  };
}

function mockFetch(body: unknown, status = 200): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  });
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', mockFetch([]));

  vi.mocked(StravaOAuthService.getConnection).mockResolvedValue(makeConnection());
  vi.mocked(StravaOAuthService.refreshAccessToken).mockResolvedValue(makeConnection());

  vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue({
    id: PROFILE_ID,
  } as any);

  vi.mocked(DataSourceConnectionRepository.upsertConnection).mockResolvedValue(makeConnection() as any);

  vi.mocked(SyncJobService.startSyncJob).mockResolvedValue(makeSyncJob('Running'));
  vi.mocked(SyncJobService.completeSyncJob).mockResolvedValue(makeSyncJob('Completed'));
  vi.mocked(SyncJobService.failSyncJob).mockResolvedValue(makeSyncJob('Failed'));

  vi.mocked(runImportPipeline).mockResolvedValue({
    status: 'success',
    importJobId: 'job-1',
    activityId: 'act-1',
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('StravaSyncService.sync', () => {
  describe('connection checks', () => {
    it('throws UNAUTHORIZED when no connection exists', async () => {
      vi.mocked(StravaOAuthService.getConnection).mockResolvedValue(null);
      await expect(StravaSyncService.sync()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('refreshes token when expired', async () => {
      const expiredConnection = makeConnection({ expiresAt: new Date(Date.now() - 1000) });
      vi.mocked(StravaOAuthService.getConnection).mockResolvedValue(expiredConnection);
      vi.mocked(StravaOAuthService.refreshAccessToken).mockResolvedValue(makeConnection());

      await StravaSyncService.sync();

      expect(StravaOAuthService.refreshAccessToken).toHaveBeenCalledWith(expiredConnection);
    });

    it('does not refresh when token is still valid', async () => {
      await StravaSyncService.sync();
      expect(StravaOAuthService.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('throws when no athlete profile found', async () => {
      vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
      await expect(StravaSyncService.sync()).rejects.toThrow('No athlete profile found');
    });
  });

  describe('SyncJob lifecycle', () => {
    it('starts a SyncJob with source Strava', async () => {
      await StravaSyncService.sync();
      expect(SyncJobService.startSyncJob).toHaveBeenCalledWith(PROFILE_ID, 'Strava');
    });

    it('completes SyncJob on success', async () => {
      await StravaSyncService.sync();
      expect(SyncJobService.completeSyncJob).toHaveBeenCalledWith(
        'sync-job-1',
        expect.objectContaining({ activitiesFound: 0, activitiesImported: 0, activitiesSkipped: 0 }),
      );
    });

    it('fails SyncJob when Strava API returns error', async () => {
      vi.stubGlobal('fetch', mockFetch({ message: 'Unauthorized' }, 401));
      const result = await StravaSyncService.sync();
      expect(result.status).toBe('Failed');
      expect(SyncJobService.failSyncJob).toHaveBeenCalledWith('sync-job-1', expect.stringContaining('401'));
    });

    it('returns the completed SyncJob', async () => {
      const result = await StravaSyncService.sync();
      expect(result.status).toBe('Completed');
    });
  });

  describe('activity fetching', () => {
    it('fetches activities with after ~30 days ago when no lastSyncedItemAt', async () => {
      vi.mocked(StravaOAuthService.getConnection).mockResolvedValue(
        makeConnection({ lastSyncedItemAt: null }),
      );
      const beforeSync = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
      await StravaSyncService.sync();
      const fetchUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      const afterParam = Number(new URL(fetchUrl).searchParams.get('after'));
      expect(afterParam).toBeGreaterThanOrEqual(beforeSync - 5);
      expect(afterParam).toBeLessThanOrEqual(beforeSync + 5);
    });

    it('fetches activities with unix timestamp when lastSyncedItemAt is set', async () => {
      const syncedAt = new Date('2024-01-15T12:00:00Z');
      vi.mocked(StravaOAuthService.getConnection).mockResolvedValue(
        makeConnection({ lastSyncedItemAt: syncedAt }),
      );
      await StravaSyncService.sync();
      const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[0]).toContain(`after=${Math.floor(syncedAt.getTime() / 1000)}`);
    });

    it('passes Bearer token in Authorization header', async () => {
      await StravaSyncService.sync();
      const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[1]?.headers?.Authorization).toBe('Bearer access-token-abc');
    });

    it('paginates until an empty page is returned', async () => {
      const page1 = [makeRawActivity({ id: 1 }), makeRawActivity({ id: 2 })];
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(page1), text: vi.fn() })
        .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]), text: vi.fn() }),
      );
      await StravaSyncService.sync();
      expect(SyncJobService.completeSyncJob).toHaveBeenCalledWith(
        'sync-job-1',
        expect.objectContaining({ activitiesFound: 2, activitiesImported: 2 }),
      );
    });

    it('stops pagination when batch has fewer than 100 items', async () => {
      const smallBatch = [makeRawActivity()];
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(smallBatch),
        text: vi.fn(),
      }));
      await StravaSyncService.sync();
      expect((fetch as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    });
  });

  describe('activity import', () => {
    it('calls runImportPipeline for each activity with source Strava', async () => {
      const activities = [makeRawActivity({ id: 11 }), makeRawActivity({ id: 22 })];
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(activities),
        text: vi.fn(),
      }));
      await StravaSyncService.sync();
      expect(runImportPipeline).toHaveBeenCalledTimes(2);
      expect(runImportPipeline).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'Strava', athleteProfileId: PROFILE_ID }),
      );
    });

    it('counts skipped activities when pipeline returns non-success', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([makeRawActivity()]),
        text: vi.fn(),
      }));
      vi.mocked(runImportPipeline).mockResolvedValue({ status: 'skipped', reason: 'duplicate' } as any);
      await StravaSyncService.sync();
      expect(SyncJobService.completeSyncJob).toHaveBeenCalledWith(
        'sync-job-1',
        expect.objectContaining({ activitiesImported: 0, activitiesSkipped: 1 }),
      );
    });

    it('passes externalId as string of activity id', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([makeRawActivity({ id: 99887766 })]),
        text: vi.fn(),
      }));
      await StravaSyncService.sync();
      expect(runImportPipeline).toHaveBeenCalledWith(
        expect.objectContaining({ externalId: '99887766' }),
      );
    });

    it('respects forceImport param', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([makeRawActivity()]),
        text: vi.fn(),
      }));
      await StravaSyncService.sync({ forceImport: true });
      expect(runImportPipeline).toHaveBeenCalledWith(
        expect.objectContaining({ forceImport: true }),
      );
    });
  });

  describe('lastSyncedAt update', () => {
    it('upserts connection with lastSyncedAt after sync', async () => {
      await StravaSyncService.sync();
      expect(DataSourceConnectionRepository.upsertConnection).toHaveBeenCalledWith(
        PROFILE_ID,
        'Strava',
        expect.objectContaining({ lastSyncedAt: expect.any(Date) }),
      );
    });

    it('updates lastSyncedItemAt to most recent activity startTime', async () => {
      const older  = makeRawActivity({ id: 1, start_date: '2024-03-01T07:00:00Z' });
      const newer  = makeRawActivity({ id: 2, start_date: '2024-03-15T07:00:00Z' });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([older, newer]),
        text: vi.fn(),
      }));
      await StravaSyncService.sync();
      const call = vi.mocked(DataSourceConnectionRepository.upsertConnection).mock.calls[0][2];
      expect((call.lastSyncedItemAt as Date).toISOString()).toBe('2024-03-15T07:00:00.000Z');
    });

    it('does not set lastSyncedItemAt when no activities were found', async () => {
      await StravaSyncService.sync();
      const call = vi.mocked(DataSourceConnectionRepository.upsertConnection).mock.calls[0][2];
      expect(call.lastSyncedItemAt).toBeUndefined();
    });
  });
});
