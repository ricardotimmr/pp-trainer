import type { DataSourceType, ImportedFile, ImportJob, ImportStatus, SyncJob } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type ImportJobWithFile = ImportJob & { importedFile: ImportedFile | null };
export type SyncJobWithImportJobs = SyncJob & { importJobs: ImportJob[] };

export type CreateImportJobInput = {
  athleteProfileId: string;
  sourceType: DataSourceType;
  rawPayloadHash?: string;
  importedFileId?: string;
  syncJobId?: string;
};

export type UpdateImportJobInput = {
  status?: ImportStatus;
  activityId?: string;
  errorMessage?: string;
  warningMessages?: string[];
};

export async function createImportJob(data: CreateImportJobInput): Promise<ImportJob> {
  return prisma.importJob.create({
    data: {
      athleteProfileId: data.athleteProfileId,
      sourceType: data.sourceType,
      status: 'Pending',
      ...(data.rawPayloadHash != null && { rawPayloadHash: data.rawPayloadHash }),
      ...(data.importedFileId != null && { importedFileId: data.importedFileId }),
      ...(data.syncJobId != null && { syncJobId: data.syncJobId }),
    },
  });
}

export async function findImportJobById(id: string): Promise<ImportJob | null> {
  return prisma.importJob.findUnique({ where: { id } });
}

export async function findImportJobWithFile(id: string): Promise<ImportJobWithFile | null> {
  return prisma.importJob.findUnique({
    where: { id },
    include: { importedFile: true },
  });
}

export type FindImportJobsFilter = {
  status?: ImportStatus;
  limit?: number;
  offset?: number;
};

export async function findImportJobs(
  athleteProfileId: string,
  filter: FindImportJobsFilter = {},
): Promise<ImportJob[]> {
  return prisma.importJob.findMany({
    where: {
      athleteProfileId,
      ...(filter.status != null && { status: filter.status }),
    },
    orderBy: { createdAt: 'desc' },
    take: filter.limit ?? 20,
    skip: filter.offset ?? 0,
  });
}

export async function findImportJobsWithoutSync(
  athleteProfileId: string,
  filter: FindImportJobsFilter = {},
): Promise<ImportJob[]> {
  return prisma.importJob.findMany({
    where: {
      athleteProfileId,
      syncJobId: null,
      ...(filter.status != null && { status: filter.status }),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function findSyncJobsWithImportJobs(
  athleteProfileId: string,
  filter: Pick<FindImportJobsFilter, 'status'> = {},
): Promise<SyncJobWithImportJobs[]> {
  return prisma.syncJob.findMany({
    where: {
      athleteProfileId,
      importJobs:
        filter.status != null
          ? { some: { status: filter.status } }
          : { some: {} },
    },
    include: {
      importJobs: {
        where: {
          ...(filter.status != null && { status: filter.status }),
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { startedAt: 'desc' },
    take: 200,
  });
}

export async function findImportJobByHash(
  rawPayloadHash: string,
  athleteProfileId: string,
): Promise<Pick<ImportJob, 'activityId'> | null> {
  return prisma.importJob.findFirst({
    where: {
      rawPayloadHash,
      athleteProfileId,
      status: 'Success',
      activityId: { not: null },
    },
    select: { activityId: true },
  });
}

export async function updateImportJob(id: string, data: UpdateImportJobInput): Promise<ImportJob> {
  return prisma.importJob.update({
    where: { id },
    data: {
      ...(data.status != null && { status: data.status }),
      ...(data.activityId != null && { activityId: data.activityId }),
      ...(data.errorMessage != null && { errorMessage: data.errorMessage }),
      ...(data.warningMessages != null && { warningMessages: data.warningMessages }),
    },
  });
}
