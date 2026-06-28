import type { DataSourceType, ImportedFileType, SyncJobStatus } from '@prisma/client';
import type {
  ImportDetailDto,
  ImportedFileRefDto,
  ImportSummaryDto,
  SyncImportBatchDto,
} from '@pp-trainer/shared';

import type {
  ImportJobWithFile,
  SyncJobWithImportJobs,
} from '../repositories/ImportJobRepository.js';
import type { ImportJob } from '@prisma/client';
import { DATA_SOURCE_TYPE_MAP, IMPORT_STATUS_MAP, IMPORTED_FILE_TYPE_MAP } from './enumMaps.js';

const SOURCE_LABEL_MAP: Record<DataSourceType, string> = {
  ManualJsonImport: 'JSON Import',
  ManualFitUpload: 'FIT Upload',
  ManualGpxUpload: 'GPX Upload',
  ManualTcxUpload: 'TCX Upload',
  ManualCsvImport: 'CSV Import',
  Mock: 'Mock Data',
  GarminOfficial: 'Garmin (Official)',
  GarminUnofficial: 'Garmin Connect',
  GarminExport: 'Garmin Export',
  Strava: 'Strava',
  Aggregator: 'Aggregator',
};

const FILE_MIME_MAP: Record<ImportedFileType, string> = {
  Fit: 'application/octet-stream',
  Gpx: 'application/gpx+xml',
  Tcx: 'application/vnd.garmin.tcx+xml',
  Json: 'application/json',
  Csv: 'text/csv',
  Unknown: 'application/octet-stream',
};

const SYNC_JOB_STATUS_MAP: Record<SyncJobStatus, SyncImportBatchDto['status']> = {
  Running: 'running',
  Completed: 'completed',
  Failed: 'failed',
};

export function mapImportSummary(job: ImportJob): ImportSummaryDto {
  return {
    entryType: 'import',
    id: job.id,
    status: IMPORT_STATUS_MAP[job.status],
    sourceType: DATA_SOURCE_TYPE_MAP[job.sourceType],
    sourceLabel: SOURCE_LABEL_MAP[job.sourceType],
    createdAt: job.createdAt.toISOString(),
    activityId: job.activityId,
    errorMessage: job.errorMessage,
  };
}

export function mapSyncImportBatch(job: SyncJobWithImportJobs): SyncImportBatchDto {
  return {
    entryType: 'sync_batch',
    id: job.id,
    syncJobId: job.id,
    sourceType: DATA_SOURCE_TYPE_MAP[job.source],
    sourceLabel: SOURCE_LABEL_MAP[job.source],
    status: SYNC_JOB_STATUS_MAP[job.status],
    startedAt: job.startedAt.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    activitiesFound: job.activitiesFound,
    activitiesImported: job.activitiesImported,
    activitiesSkipped: job.activitiesSkipped,
    healthDaysFound: job.healthDaysFound,
    healthDaysImported: job.healthDaysImported,
    errorMessage: job.errorMessage,
    imports: job.importJobs.map(mapImportSummary),
  };
}

function mapImportedFileRef(file: NonNullable<ImportJobWithFile['importedFile']>): ImportedFileRefDto {
  return {
    id: file.id,
    originalName: file.fileName,
    fileSize: file.fileSizeBytes,
    mimeType: FILE_MIME_MAP[file.fileType],
    fileType: IMPORTED_FILE_TYPE_MAP[file.fileType],
  };
}

export function mapImportDetail(job: ImportJobWithFile): ImportDetailDto {
  return {
    ...mapImportSummary(job),
    updatedAt: job.updatedAt.toISOString(),
    rawPayloadHash: job.rawPayloadHash,
    warningMessages: job.warningMessages,
    importedFile: job.importedFile != null ? mapImportedFileRef(job.importedFile) : null,
  };
}
