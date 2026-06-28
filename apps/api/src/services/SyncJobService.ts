import type { DataSourceType, SyncJob, SyncJobStatus } from '@prisma/client';
import type { SyncHistoryResponseDto, SyncJobDto } from '@pp-trainer/shared';

import { DATA_SOURCE_TYPE_MAP } from '../mappers/enumMaps.js';
import * as SyncJobRepository from '../repositories/SyncJobRepository.js';

const SYNC_JOB_STATUS_MAP: Record<SyncJobStatus, 'running' | 'completed' | 'failed'> = {
  Running: 'running',
  Completed: 'completed',
  Failed: 'failed',
};

function mapSyncJob(job: SyncJob): SyncJobDto {
  return {
    id: job.id,
    source: DATA_SOURCE_TYPE_MAP[job.source],
    status: SYNC_JOB_STATUS_MAP[job.status],
    startedAt: job.startedAt.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    activitiesFound: job.activitiesFound,
    activitiesImported: job.activitiesImported,
    activitiesSkipped: job.activitiesSkipped,
    healthDaysFound: job.healthDaysFound,
    healthDaysImported: job.healthDaysImported,
    errorMessage: job.errorMessage ?? undefined,
  };
}

export async function startSyncJob(
  athleteProfileId: string,
  source: DataSourceType,
): Promise<SyncJob> {
  return SyncJobRepository.createSyncJob({
    athleteProfileId,
    source,
    status: 'Running',
    startedAt: new Date(),
  });
}

export async function completeSyncJob(
  id: string,
  counts: {
    activitiesFound: number;
    activitiesImported: number;
    activitiesSkipped: number;
    healthDaysFound: number;
    healthDaysImported: number;
  },
): Promise<SyncJob> {
  return SyncJobRepository.updateSyncJob(id, {
    status: 'Completed',
    completedAt: new Date(),
    ...counts,
  });
}

export async function failSyncJob(id: string, errorMessage: string): Promise<SyncJob> {
  return SyncJobRepository.updateSyncJob(id, {
    status: 'Failed',
    completedAt: new Date(),
    errorMessage,
  });
}

export async function getSyncHistory(
  athleteProfileId: string,
  source?: DataSourceType,
): Promise<SyncHistoryResponseDto> {
  const jobs = await SyncJobRepository.findSyncJobs(athleteProfileId, source);
  return { jobs: jobs.map(mapSyncJob) };
}
