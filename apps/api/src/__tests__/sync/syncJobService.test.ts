import type { SyncJob } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as SyncJobRepository from '../../repositories/SyncJobRepository.js';
import * as SyncJobService from '../../services/SyncJobService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../repositories/SyncJobRepository.js');

const PROFILE_ID = 'profile-abc';

function makeSyncJob(overrides: Partial<SyncJob> = {}): SyncJob {
  return {
    id: 'job-1',
    createdAt: new Date('2026-06-27T10:00:00Z'),
    updatedAt: new Date('2026-06-27T10:00:00Z'),
    athleteProfileId: PROFILE_ID,
    source: 'GarminUnofficial',
    status: 'Running',
    startedAt: new Date('2026-06-27T10:00:00Z'),
    completedAt: null,
    activitiesFound: 0,
    activitiesImported: 0,
    activitiesSkipped: 0,
    healthDaysFound: 0,
    healthDaysImported: 0,
    errorMessage: null,
    ...overrides,
  };
}

describe('SyncJobService', () => {
  beforeEach(() => vi.resetAllMocks());

  describe('startSyncJob', () => {
    it('creates a Running sync job with startedAt', async () => {
      const job = makeSyncJob();
      vi.mocked(SyncJobRepository.createSyncJob).mockResolvedValue(job);

      await SyncJobService.startSyncJob(PROFILE_ID, 'GarminUnofficial');

      expect(SyncJobRepository.createSyncJob).toHaveBeenCalledWith(
        expect.objectContaining({
          athleteProfileId: PROFILE_ID,
          source: 'GarminUnofficial',
          status: 'Running',
          startedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('completeSyncJob', () => {
    it('updates job to Completed with counts and completedAt', async () => {
      const job = makeSyncJob({
        status: 'Completed',
        completedAt: new Date('2026-06-27T10:05:00Z'),
        activitiesFound: 10,
        activitiesImported: 8,
        activitiesSkipped: 2,
      });
      vi.mocked(SyncJobRepository.updateSyncJob).mockResolvedValue(job);

      await SyncJobService.completeSyncJob('job-1', {
        activitiesFound: 10,
        activitiesImported: 8,
        activitiesSkipped: 2,
        healthDaysFound: 0,
        healthDaysImported: 0,
      });

      expect(SyncJobRepository.updateSyncJob).toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({
          status: 'Completed',
          completedAt: expect.any(Date),
          activitiesFound: 10,
          activitiesImported: 8,
          activitiesSkipped: 2,
          healthDaysFound: 0,
          healthDaysImported: 0,
        }),
      );
    });
  });

  describe('failSyncJob', () => {
    it('updates job to Failed with errorMessage and completedAt', async () => {
      const job = makeSyncJob({ status: 'Failed', errorMessage: 'Auth error' });
      vi.mocked(SyncJobRepository.updateSyncJob).mockResolvedValue(job);

      await SyncJobService.failSyncJob('job-1', 'Auth error');

      expect(SyncJobRepository.updateSyncJob).toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({
          status: 'Failed',
          completedAt: expect.any(Date),
          errorMessage: 'Auth error',
        }),
      );
    });
  });

  describe('getSyncHistory', () => {
    it('returns mapped DTO list without source filter', async () => {
      const job = makeSyncJob({
        status: 'Completed',
        completedAt: new Date('2026-06-27T10:05:00Z'),
        activitiesFound: 5,
        activitiesImported: 5,
        activitiesSkipped: 0,
      });
      vi.mocked(SyncJobRepository.findSyncJobs).mockResolvedValue([job]);

      const result = await SyncJobService.getSyncHistory(PROFILE_ID);

      expect(SyncJobRepository.findSyncJobs).toHaveBeenCalledWith(PROFILE_ID, undefined);
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0]).toMatchObject({
        id: 'job-1',
        source: 'garmin_unofficial',
        status: 'completed',
        activitiesFound: 5,
        activitiesImported: 5,
        activitiesSkipped: 0,
      });
    });

    it('passes source filter to repository', async () => {
      vi.mocked(SyncJobRepository.findSyncJobs).mockResolvedValue([]);

      await SyncJobService.getSyncHistory(PROFILE_ID, 'Strava');

      expect(SyncJobRepository.findSyncJobs).toHaveBeenCalledWith(PROFILE_ID, 'Strava');
    });

    it('maps job status correctly', async () => {
      vi.mocked(SyncJobRepository.findSyncJobs).mockResolvedValue([
        makeSyncJob({ status: 'Running' }),
        makeSyncJob({ id: 'job-2', status: 'Completed' }),
        makeSyncJob({ id: 'job-3', status: 'Failed' }),
      ]);

      const result = await SyncJobService.getSyncHistory(PROFILE_ID);

      expect(result.jobs.map((j) => j.status)).toEqual(['running', 'completed', 'failed']);
    });

    it('maps errorMessage and omits when null', async () => {
      vi.mocked(SyncJobRepository.findSyncJobs).mockResolvedValue([
        makeSyncJob({ errorMessage: null }),
        makeSyncJob({ id: 'job-2', status: 'Failed', errorMessage: 'timeout' }),
      ]);

      const result = await SyncJobService.getSyncHistory(PROFILE_ID);

      expect(result.jobs[0].errorMessage).toBeUndefined();
      expect(result.jobs[1].errorMessage).toBe('timeout');
    });

    it('returns empty jobs array when no jobs found', async () => {
      vi.mocked(SyncJobRepository.findSyncJobs).mockResolvedValue([]);

      const result = await SyncJobService.getSyncHistory(PROFILE_ID);

      expect(result.jobs).toEqual([]);
    });
  });
});
