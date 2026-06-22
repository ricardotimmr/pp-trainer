import { z } from 'zod';

import {
  IdSchema,
  IsoDateTimeStringSchema,
  NonNegativeIntegerSchema,
} from './common.js';
import {
  DataSourceTypeSchema,
  ImportedFileTypeSchema,
  ImportStatusSchema,
  RawDataFormatSchema,
} from './enums.js';

export const ImportHistoryItemDtoSchema = z.object({
  id: IdSchema,
  sourceType: DataSourceTypeSchema,
  fileName: z.string().min(1),
  fileType: ImportedFileTypeSchema,
  fileSizeBytes: NonNegativeIntegerSchema.optional(),
  importStatus: ImportStatusSchema,
  errorMessage: z.string().optional(),
  activityCount: NonNegativeIntegerSchema,
  uploadedAt: IsoDateTimeStringSchema,
  processedAt: IsoDateTimeStringSchema.optional(),
});

export const RawActivityDataReferenceDtoSchema = z.object({
  id: IdSchema,
  sourceType: DataSourceTypeSchema,
  rawFormat: RawDataFormatSchema,
  externalId: z.string().optional(),
});

export const ImportHistoryResponseDtoSchema = z.object({
  imports: z.array(ImportHistoryItemDtoSchema),
});

export const ImportResultDtoSchema = z.object({
  importId: IdSchema,
  status: ImportStatusSchema,
  activityId: z.string().optional(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type ImportHistoryItemDto = z.infer<typeof ImportHistoryItemDtoSchema>;
export type RawActivityDataReferenceDto = z.infer<
  typeof RawActivityDataReferenceDtoSchema
>;
export type ImportHistoryResponseDto = z.infer<
  typeof ImportHistoryResponseDtoSchema
>;
export type ImportResultDto = z.infer<typeof ImportResultDtoSchema>;
