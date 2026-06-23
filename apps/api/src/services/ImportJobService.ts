import type { DataSourceType, ImportJob, ImportStatus } from '@prisma/client';
import type { ImportDetailDto, ImportListResponseDto } from '@pp-trainer/shared';

import { mapImportDetail, mapImportSummary } from '../mappers/mapImportJob.js';
import { ApiError } from '../errors/ApiError.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as ImportJobRepository from '../repositories/ImportJobRepository.js';

export type StartJobParams = {
  athleteProfileId: string;
  sourceType: DataSourceType;
  rawPayloadHash?: string;
  importedFileId?: string;
};

export async function startJob(params: StartJobParams): Promise<ImportJob> {
  const job = await ImportJobRepository.createImportJob(params);
  return ImportJobRepository.updateImportJob(job.id, { status: 'Processing' });
}

export async function completeJob(id: string, activityId: string): Promise<ImportJob> {
  return ImportJobRepository.updateImportJob(id, {
    status: 'Success',
    activityId,
  });
}

export async function failJob(
  id: string,
  errorMessage: string,
  warningMessages?: string[],
): Promise<ImportJob> {
  return ImportJobRepository.updateImportJob(id, {
    status: 'Failed',
    errorMessage,
    ...(warningMessages != null && { warningMessages }),
  });
}

export async function markDuplicate(
  id: string,
  existingActivityId: string,
  warningMessages?: string[],
): Promise<ImportJob> {
  return ImportJobRepository.updateImportJob(id, {
    status: 'Duplicate',
    activityId: existingActivityId,
    ...(warningMessages != null && { warningMessages }),
  });
}

export async function getJobById(id: string): Promise<ImportJob | null> {
  return ImportJobRepository.findImportJobById(id);
}

export type GetJobsFilter = {
  status?: ImportJob['status'];
  limit?: number;
  offset?: number;
};

export async function getJobs(
  athleteProfileId: string,
  filter: GetJobsFilter = {},
): Promise<ImportJob[]> {
  return ImportJobRepository.findImportJobs(athleteProfileId, filter);
}

export type GetImportsFilter = {
  status?: ImportStatus;
  limit?: number;
  offset?: number;
};

export async function getImports(filter: GetImportsFilter = {}): Promise<ImportListResponseDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (profile == null) {
    return { imports: [] };
  }

  const jobs = await ImportJobRepository.findImportJobs(profile.id, filter);
  return { imports: jobs.map(mapImportSummary) };
}

export async function getImportById(id: string): Promise<ImportDetailDto> {
  const job = await ImportJobRepository.findImportJobWithFile(id);
  if (job == null) {
    throw ApiError.notFound(`Import job '${id}' not found`);
  }
  return mapImportDetail(job);
}
