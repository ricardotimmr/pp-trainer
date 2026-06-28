import type { DataSourceType, SyncJob, SyncJobStatus } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export async function createSyncJob(params: {
  athleteProfileId: string;
  source: DataSourceType;
  status: SyncJobStatus;
  startedAt: Date;
}): Promise<SyncJob> {
  return prisma.syncJob.create({ data: params });
}

export async function updateSyncJob(
  id: string,
  data: Partial<{
    status: SyncJobStatus;
    completedAt: Date;
    activitiesFound: number;
    activitiesImported: number;
    activitiesSkipped: number;
    healthDaysFound: number;
    healthDaysImported: number;
    errorMessage: string;
  }>,
): Promise<SyncJob> {
  return prisma.syncJob.update({ where: { id }, data });
}

export async function findSyncJobs(
  athleteProfileId: string,
  source?: DataSourceType,
  limit = 20,
): Promise<SyncJob[]> {
  return prisma.syncJob.findMany({
    where: { athleteProfileId, ...(source != null ? { source } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
