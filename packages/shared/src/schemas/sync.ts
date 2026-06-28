import { z } from 'zod';

import { IsoDateTimeStringSchema } from './common.js';
import { DataSourceTypeSchema } from './enums.js';

export const SyncJobStatusSchema = z.enum(['running', 'completed', 'failed']);

export const SyncJobDtoSchema = z.object({
  id: z.string(),
  source: DataSourceTypeSchema,
  status: SyncJobStatusSchema,
  startedAt: IsoDateTimeStringSchema,
  completedAt: IsoDateTimeStringSchema.optional(),
  activitiesFound: z.int().nonnegative(),
  activitiesImported: z.int().nonnegative(),
  activitiesSkipped: z.int().nonnegative(),
  healthDaysFound: z.int().nonnegative(),
  healthDaysImported: z.int().nonnegative(),
  errorMessage: z.string().optional(),
});

export const SyncHistoryResponseDtoSchema = z.object({
  jobs: z.array(SyncJobDtoSchema),
});

export const GarminSyncStatusDtoSchema = z.object({
  configured: z.boolean(),
  lastSync: SyncJobDtoSchema.nullable(),
});

export type SyncJobStatusDto = z.infer<typeof SyncJobStatusSchema>;
export type SyncJobDto = z.infer<typeof SyncJobDtoSchema>;
export type SyncHistoryResponseDto = z.infer<typeof SyncHistoryResponseDtoSchema>;
export type GarminSyncStatusDto = z.infer<typeof GarminSyncStatusDtoSchema>;
