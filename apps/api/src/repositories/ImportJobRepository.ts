import type { DataSourceType, ImportJob, ImportStatus } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type CreateImportJobInput = {
  athleteProfileId: string;
  sourceType: DataSourceType;
  rawPayloadHash?: string;
  importedFileId?: string;
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
    },
  });
}

export async function findImportJobById(id: string): Promise<ImportJob | null> {
  return prisma.importJob.findUnique({ where: { id } });
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
