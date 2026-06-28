import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AthleteProfile, DataSourceConnection, DailyHealthSummary, HrvStatus, SleepSession, SyncJob } from '@prisma/client';
import type { ApiConfig } from '../../config/env.js';

vi.mock('../../lib/prisma.js', () => ({ prisma: {}, disconnectPrisma: vi.fn() }));

vi.mock('node:child_process', () => ({ spawn: vi.fn() }));

vi.mock('node:fs/promises', () => ({
  access:   vi.fn(),
  readFile: vi.fn(),
  rm:       vi.fn(),
}));

vi.mock('../../config/env.js', () => ({
  getApiConfig: vi.fn(),
}));

vi.mock('../../repositories/AthleteRepository.js');
vi.mock('../../repositories/DataSourceConnectionRepository.js');
vi.mock('../../services/SyncJobService.js');
vi.mock('../../import/pipeline/runImportPipeline.js');
vi.mock('../../repositories/DailyHealthRepository.js');
vi.mock('../../repositories/SleepSessionRepository.js');
vi.mock('../../repositories/HrvStatusRepository.js');

const { spawn }    = await import('node:child_process');
const { access, readFile, rm } = await import('node:fs/promises');
const { getApiConfig } = await import('../../config/env.js');
const AthleteRepository = await import('../../repositories/AthleteRepository.js');
const DataSourceConnectionRepository = await import('../../repositories/DataSourceConnectionRepository.js');
const SyncJobService  = await import('../../services/SyncJobService.js');
const { runImportPipeline } = await import('../../import/pipeline/runImportPipeline.js');
const DailyHealthRepository  = await import('../../repositories/DailyHealthRepository.js');
const SleepSessionRepository = await import('../../repositories/SleepSessionRepository.js');
const HrvStatusRepository    = await import('../../repositories/HrvStatusRepository.js');

// Import the system under test LAST so all mocks are in place
const GarminSyncService = await import('../../services/GarminSyncService.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

const PROFILE_ID = 'profile-abc';
const TMP_DIR    = '/tmp/garmin_sync_test123';

function makeSyncJob(status: 'Running' | 'Completed' | 'Failed'): SyncJob {
  return {
    id: 'sync-job-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    athleteProfileId: PROFILE_ID,
    source: 'GarminUnofficial',
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

type Manifest = {
  tmpDir: string;
  activities: Array<{
    garminId: string;
    fitFilePath: string;
    sport: string;
    startTime: string;
    durationSeconds: number;
  }>;
  healthDays: Array<{
    date: string;
    dailySummary: Record<string, number | null> | null;
    sleep: Record<string, number | string | null> | null;
    hrv: Record<string, number | string | null> | null;
  }>;
  error: string | null;
};

const MANIFEST_EMPTY: Manifest = {
  tmpDir: TMP_DIR, activities: [], healthDays: [], error: null,
};

function makeFakeProcess(manifestJson: string, exitCode = 0): ChildProcess {
  const proc = new EventEmitter() as unknown as ChildProcess & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: () => void;
  };
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill   = vi.fn();
  setTimeout(() => {
    proc.stdout.emit('data', Buffer.from(manifestJson));
    (proc as unknown as EventEmitter).emit('close', exitCode);
  }, 0);
  return proc;
}

function makeErrorProcess(error: Error): ChildProcess {
  const proc = new EventEmitter() as unknown as ChildProcess & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: () => void;
  };
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill   = vi.fn();
  setTimeout(() => (proc as unknown as EventEmitter).emit('error', error), 0);
  return proc;
}

function mockSpawn(manifest: Manifest, exitCode = 0) {
  vi.mocked(spawn).mockReturnValue(
    makeFakeProcess(JSON.stringify(manifest), exitCode),
  );
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();

  // No venv present → falls back to system python3
  vi.mocked(access).mockRejectedValue(new Error('not found'));
  vi.mocked(readFile).mockResolvedValue(Buffer.from('fake-fit-data'));
  vi.mocked(rm).mockResolvedValue(undefined);

  vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(
    { id: PROFILE_ID } as unknown as AthleteProfile,
  );
  vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue(null);
  vi.mocked(getApiConfig).mockReturnValue({
    garminEmail: 'env@test.com',
    garminPassword: 'envpass',
  } as unknown as ApiConfig);

  vi.mocked(SyncJobService.startSyncJob).mockResolvedValue(makeSyncJob('Running'));
  vi.mocked(SyncJobService.completeSyncJob).mockResolvedValue(makeSyncJob('Completed'));
  vi.mocked(SyncJobService.failSyncJob).mockResolvedValue(makeSyncJob('Failed'));

  vi.mocked(runImportPipeline).mockResolvedValue({
    status: 'success', importJobId: 'job-1', activityId: 'act-1',
  });
  vi.mocked(DailyHealthRepository.upsertDailyHealth).mockResolvedValue({} as unknown as DailyHealthSummary);
  vi.mocked(SleepSessionRepository.upsertSleepSession).mockResolvedValue({} as unknown as SleepSession);
  vi.mocked(HrvStatusRepository.upsertHrvStatus).mockResolvedValue({} as unknown as HrvStatus);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GarminSyncService.sync', () => {
  describe('SyncJob lifecycle', () => {
    it('creates Running SyncJob before spawning Python', async () => {
      mockSpawn(MANIFEST_EMPTY);
      await GarminSyncService.sync();
      expect(SyncJobService.startSyncJob).toHaveBeenCalledWith(PROFILE_ID, 'GarminUnofficial');
    });

    it('marks SyncJob Completed on success with correct counts', async () => {
      const manifest: Manifest = {
        tmpDir: TMP_DIR,
        activities: [
          { garminId: 'g1', fitFilePath: `${TMP_DIR}/g1.fit`, sport: 'running', startTime: '2026-06-27 07:30:00', durationSeconds: 3600 },
          { garminId: 'g2', fitFilePath: `${TMP_DIR}/g2.fit`, sport: 'cycling', startTime: '2026-06-26 17:00:00', durationSeconds: 7200 },
        ],
        healthDays: [
          { date: '2026-06-27', dailySummary: { restingHeartRate: 52 }, sleep: null, hrv: null },
        ],
        error: null,
      };
      mockSpawn(manifest);
      vi.mocked(runImportPipeline)
        .mockResolvedValueOnce({ status: 'success', importJobId: 'j1', activityId: 'a1' })
        .mockResolvedValueOnce({ status: 'duplicate', importJobId: 'j2', activityId: 'a2', reason: 'dup' });

      await GarminSyncService.sync();

      expect(SyncJobService.completeSyncJob).toHaveBeenCalledWith(
        'sync-job-1',
        expect.objectContaining({
          activitiesFound: 2,
          activitiesImported: 1,
          activitiesSkipped: 1,
          healthDaysFound: 1,
          healthDaysImported: 1,
        }),
      );
    });

    it('marks SyncJob Failed when manifest.error is set', async () => {
      mockSpawn({ ...MANIFEST_EMPTY, error: 'Authentication failed' });
      await GarminSyncService.sync();
      expect(SyncJobService.failSyncJob).toHaveBeenCalledWith('sync-job-1', 'Authentication failed');
      expect(SyncJobService.completeSyncJob).not.toHaveBeenCalled();
    });

    it('marks SyncJob Failed when Python produces no output', async () => {
      vi.mocked(spawn).mockReturnValue(makeFakeProcess('', 1));
      await GarminSyncService.sync();
      expect(SyncJobService.failSyncJob).toHaveBeenCalledWith(
        'sync-job-1',
        expect.stringContaining('no output'),
      );
    });

    it('marks SyncJob Failed when Python cannot be spawned', async () => {
      vi.mocked(spawn).mockReturnValue(
        makeErrorProcess(new Error('ENOENT: python3 not found')),
      );
      await GarminSyncService.sync();
      expect(SyncJobService.failSyncJob).toHaveBeenCalledWith(
        'sync-job-1',
        expect.stringContaining('python3'),
      );
    });
  });

  describe('activity processing', () => {
    it('calls runImportPipeline for each activity in manifest', async () => {
      const manifest: Manifest = {
        tmpDir: TMP_DIR,
        activities: [
          { garminId: 'g1', fitFilePath: `${TMP_DIR}/g1.fit`, sport: 'running', startTime: '2026-06-27 07:30:00', durationSeconds: 3600 },
          { garminId: 'g2', fitFilePath: `${TMP_DIR}/g2.fit`, sport: 'cycling', startTime: '2026-06-26 17:00:00', durationSeconds: 7200 },
        ],
        healthDays: [],
        error: null,
      };
      mockSpawn(manifest);
      await GarminSyncService.sync();
      expect(runImportPipeline).toHaveBeenCalledTimes(2);
    });

    it('calls runImportPipeline with correct source and externalId', async () => {
      const manifest: Manifest = {
        tmpDir: TMP_DIR,
        activities: [
          { garminId: 'garmin-999', fitFilePath: `${TMP_DIR}/garmin-999.fit`, sport: 'running', startTime: '2026-06-27 07:30:00', durationSeconds: 3600 },
        ],
        healthDays: [],
        error: null,
      };
      mockSpawn(manifest);
      await GarminSyncService.sync();
      expect(runImportPipeline).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'GarminUnofficial',
          externalId: 'garmin-999',
        }),
      );
    });

    it('passes forceImport through to runImportPipeline', async () => {
      mockSpawn({
        ...MANIFEST_EMPTY,
        activities: [
          { garminId: 'g1', fitFilePath: `${TMP_DIR}/g1.fit`, sport: 'running', startTime: '2026-06-27 07:30:00', durationSeconds: 3600 },
        ],
      });
      await GarminSyncService.sync({ forceImport: true });
      expect(runImportPipeline).toHaveBeenCalledWith(
        expect.objectContaining({ forceImport: true }),
      );
    });
  });

  describe('health day upserts', () => {
    it('calls upsertDailyHealth for each day with dailySummary', async () => {
      mockSpawn({
        ...MANIFEST_EMPTY,
        healthDays: [
          { date: '2026-06-27', dailySummary: { restingHeartRate: 52, steps: 8400 }, sleep: null, hrv: null },
          { date: '2026-06-26', dailySummary: null, sleep: null, hrv: null },
        ],
      });
      await GarminSyncService.sync();
      expect(DailyHealthRepository.upsertDailyHealth).toHaveBeenCalledTimes(1);
      expect(DailyHealthRepository.upsertDailyHealth).toHaveBeenCalledWith(
        PROFILE_ID,
        new Date('2026-06-27T00:00:00.000Z'),
        'GarminUnofficial',
        expect.objectContaining({ restingHeartRate: 52, steps: 8400 }),
      );
    });

    it('calls upsertSleepSession for each day with sleep data', async () => {
      mockSpawn({
        ...MANIFEST_EMPTY,
        healthDays: [
          { date: '2026-06-27', dailySummary: null, sleep: { totalSleepSeconds: 27000, sleepScore: 74 }, hrv: null },
        ],
      });
      await GarminSyncService.sync();
      expect(SleepSessionRepository.upsertSleepSession).toHaveBeenCalledWith(
        PROFILE_ID,
        new Date('2026-06-27T00:00:00.000Z'),
        'GarminUnofficial',
        expect.objectContaining({ totalSleepSeconds: 27000, sleepScore: 74 }),
      );
    });

    it('calls upsertHrvStatus for each day with hrv data', async () => {
      mockSpawn({
        ...MANIFEST_EMPTY,
        healthDays: [
          { date: '2026-06-27', dailySummary: null, sleep: null, hrv: { weeklyAvgHrv: 58, lastNightAvgHrv: 62, lastNightFiveMinHigh: 78, status: 'balanced' } },
        ],
      });
      await GarminSyncService.sync();
      expect(HrvStatusRepository.upsertHrvStatus).toHaveBeenCalledWith(
        PROFILE_ID,
        new Date('2026-06-27T00:00:00.000Z'),
        'GarminUnofficial',
        expect.objectContaining({ weeklyAvgHrv: 58, status: 'balanced' }),
      );
    });

    it('skips upserts for days where all health data is null', async () => {
      mockSpawn({
        ...MANIFEST_EMPTY,
        healthDays: [
          { date: '2026-06-27', dailySummary: null, sleep: null, hrv: null },
        ],
      });
      await GarminSyncService.sync();
      expect(DailyHealthRepository.upsertDailyHealth).not.toHaveBeenCalled();
      expect(SleepSessionRepository.upsertSleepSession).not.toHaveBeenCalled();
      expect(HrvStatusRepository.upsertHrvStatus).not.toHaveBeenCalled();
    });
  });

  describe('tmpDir cleanup', () => {
    it('deletes tmpDir on success', async () => {
      mockSpawn(MANIFEST_EMPTY);
      await GarminSyncService.sync();
      expect(rm).toHaveBeenCalledWith(TMP_DIR, { recursive: true, force: true });
    });

    it('deletes tmpDir when manifest.error is set', async () => {
      mockSpawn({ ...MANIFEST_EMPTY, error: 'Auth failed' });
      await GarminSyncService.sync();
      expect(rm).toHaveBeenCalledWith(TMP_DIR, { recursive: true, force: true });
    });

    it('does not call rm when Python spawn fails (no tmpDir available)', async () => {
      vi.mocked(spawn).mockReturnValue(
        makeErrorProcess(new Error('ENOENT')),
      );
      await GarminSyncService.sync();
      expect(rm).not.toHaveBeenCalled();
    });
  });

  describe('credential resolution', () => {
    it('uses DataSourceConnection credentials when available', async () => {
      vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue({
        username: 'db@test.com',
        password: 'dbpass',
      } as unknown as DataSourceConnection);
      mockSpawn(MANIFEST_EMPTY);
      await GarminSyncService.sync();

      const spawnArgs = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(spawnArgs).toContain('db@test.com');
      expect(spawnArgs).toContain('dbpass');
    });

    it('falls back to env credentials when no DataSourceConnection exists', async () => {
      vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue(null);
      vi.mocked(getApiConfig).mockReturnValue({
        garminEmail: 'env@test.com',
        garminPassword: 'envpass',
      } as unknown as ApiConfig);
      mockSpawn(MANIFEST_EMPTY);
      await GarminSyncService.sync();

      const spawnArgs = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(spawnArgs).toContain('env@test.com');
      expect(spawnArgs).toContain('envpass');
    });

    it('does not fall back to env when DataSourceConnection has credentials', async () => {
      vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue({
        username: 'db@test.com',
        password: 'dbpass',
      } as unknown as DataSourceConnection);
      mockSpawn(MANIFEST_EMPTY);
      await GarminSyncService.sync();

      // env credentials should not be passed
      const spawnArgs = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(spawnArgs).not.toContain('env@test.com');
    });

    it('throws when no credentials are configured', async () => {
      vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue(null);
      vi.mocked(getApiConfig).mockReturnValue({
        garminEmail: undefined,
        garminPassword: undefined,
      } as unknown as ApiConfig);

      await expect(GarminSyncService.sync()).rejects.toThrow('credentials');
      expect(SyncJobService.startSyncJob).not.toHaveBeenCalled();
      expect(spawn).not.toHaveBeenCalled();
    });
  });

  describe('Python executable resolution', () => {
    it('uses venv python when scripts/.venv/bin/python3 exists', async () => {
      vi.mocked(access).mockResolvedValue(undefined);
      mockSpawn(MANIFEST_EMPTY);
      await GarminSyncService.sync();

      const pythonCmd = vi.mocked(spawn).mock.calls[0][0] as string;
      expect(pythonCmd).toContain('.venv');
    });

    it('falls back to system python3 when venv is not present', async () => {
      vi.mocked(access).mockRejectedValue(new Error('not found'));
      mockSpawn(MANIFEST_EMPTY);
      await GarminSyncService.sync();

      const pythonCmd = vi.mocked(spawn).mock.calls[0][0] as string;
      expect(pythonCmd).toBe('python3');
    });
  });
});
