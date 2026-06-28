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
  SportTypeSchema,
  SwimStrokeTypeSchema,
} from './enums.js';
import { SyncJobStatusSchema } from './sync.js';

// ── ADR-006 sub-schemas ────────────────────────────────────────────────────────

const LapSchema = z.object({
  lapNumber: z.int().positive(),
  durationSeconds: z.int().positive(),
  distanceMeters: z.int().nonnegative(),
  averageHeartRateBpm: z.int().positive().optional(),
  maxHeartRateBpm: z.int().positive().optional(),
  averagePaceSecPerKm: z.int().positive().optional(),
  averageSpeedKmh: z.number().positive().optional(),
  averagePowerWatts: z.int().positive().optional(),
  averageCadence: z.number().positive().optional(),
  elevationGainMeters: z.int().nonnegative().optional(),
});

const SwimLapSchema = z.object({
  lapNumber: z.int().positive(),
  durationSeconds: z.int().positive(),
  distanceMeters: z.int().positive(),
  strokeType: SwimStrokeTypeSchema.optional(),
  strokeCount: z.int().positive().optional(),
  swolfScore: z.int().positive().optional(),
  averagePaceSecPer100m: z.int().positive().optional(),
  averageHeartRateBpm: z.int().positive().optional(),
});

const StrengthSetSchema = z.object({
  setNumber: z.int().positive(),
  exerciseName: z.string().optional(),
  exerciseCategory: z.string().optional(),
  muscleGroup: z.string().optional(),
  reps: z.int().positive().optional(),
  weightKg: z.number().nonnegative().optional(),
  durationSeconds: z.int().positive().optional(),
  restSeconds: z.int().nonnegative().optional(),
  notes: z.string().optional(),
});

const MetricSampleSchema = z.object({
  offsetSeconds: z.int().nonnegative(),
  heartRateBpm: z.int().positive().optional(),
  powerWatts: z.int().positive().optional(),
  paceSecPerKm: z.int().positive().optional(),
  swimPaceSecPer100m: z.int().positive().optional(),
  speedKmh: z.number().positive().optional(),
  cadenceRpm: z.number().positive().optional(),
  elevationMeters: z.number().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const TimeInZoneSchema = z.object({
  zoneNumber: z.int().positive(),
  zoneName: z.string().min(1),
  durationSeconds: z.int().nonnegative(),
  percentage: z.number().min(0).max(100),
});

// ── Main request schema ────────────────────────────────────────────────────────

export const ActivityJsonImportRequestSchema = z.object({
  athleteProfileId: z.string().min(1),
  sport: SportTypeSchema,
  startTime: z.string().datetime({ offset: true }),
  durationSeconds: z.int().positive(),
  title: z.string().optional(),
  notes: z.string().optional(),
  distanceMeters: z.int().nonnegative().optional(),
  elevationGainMeters: z.int().nonnegative().optional(),
  averageHeartRate: z.int().positive().optional(),
  maxHeartRate: z.int().positive().optional(),
  averagePowerWatts: z.int().positive().optional(),
  normalizedPowerWatts: z.int().positive().optional(),
  averageCadence: z.number().positive().optional(),
  averageSpeedKmh: z.number().positive().optional(),
  calories: z.int().positive().optional(),
  perceivedExertion: z.int().min(1).max(10).optional(),
  // swimming
  poolLengthMeters: z.int().positive().optional(),
  dominantStrokeType: SwimStrokeTypeSchema.optional(),
  totalStrokeCount: z.int().positive().optional(),
  swimLaps: z.array(SwimLapSchema).optional(),
  // strength
  totalSets: z.int().positive().optional(),
  totalReps: z.int().positive().optional(),
  strengthSets: z.array(StrengthSetSchema).optional(),
  // nested data
  laps: z.array(LapSchema).optional(),
  metricSamples: z.array(MetricSampleSchema).optional(),
  timeInZones: z.array(TimeInZoneSchema).optional(),
  // dev-only bypass
  forceImport: z.boolean().optional(),
});

export type ActivityJsonImportRequest = z.infer<
  typeof ActivityJsonImportRequestSchema
>;

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

// ── ImportJob read DTOs (P4-005) ──────────────────────────────────────────────

export const ImportedFileRefDtoSchema = z.object({
  id: IdSchema,
  originalName: z.string(),
  fileSize: z.number().nullable(),
  mimeType: z.string(),
  fileType: ImportedFileTypeSchema,
});

export const ImportSummaryDtoSchema = z.object({
  entryType: z.literal('import').default('import'),
  id: IdSchema,
  status: ImportStatusSchema,
  sourceType: DataSourceTypeSchema,
  sourceLabel: z.string(),
  createdAt: IsoDateTimeStringSchema,
  activityId: z.string().nullable(),
  errorMessage: z.string().nullable(),
});

export const ImportDetailDtoSchema = ImportSummaryDtoSchema.extend({
  updatedAt: IsoDateTimeStringSchema,
  rawPayloadHash: z.string().nullable(),
  warningMessages: z.array(z.string()),
  importedFile: ImportedFileRefDtoSchema.nullable(),
});

export const SyncImportBatchDtoSchema = z.object({
  entryType: z.literal('sync_batch'),
  id: IdSchema,
  syncJobId: IdSchema,
  sourceType: DataSourceTypeSchema,
  sourceLabel: z.string(),
  status: SyncJobStatusSchema,
  startedAt: IsoDateTimeStringSchema,
  completedAt: IsoDateTimeStringSchema.optional(),
  activitiesFound: NonNegativeIntegerSchema,
  activitiesImported: NonNegativeIntegerSchema,
  activitiesSkipped: NonNegativeIntegerSchema,
  healthDaysFound: NonNegativeIntegerSchema,
  healthDaysImported: NonNegativeIntegerSchema,
  errorMessage: z.string().nullable(),
  imports: z.array(ImportSummaryDtoSchema),
});

export const ImportListEntryDtoSchema = z.discriminatedUnion('entryType', [
  ImportSummaryDtoSchema,
  SyncImportBatchDtoSchema,
]);

export const ImportListResponseDtoSchema = z.object({
  imports: z.array(ImportListEntryDtoSchema),
});

export type ImportHistoryItemDto = z.infer<typeof ImportHistoryItemDtoSchema>;
export type RawActivityDataReferenceDto = z.infer<
  typeof RawActivityDataReferenceDtoSchema
>;
export type ImportHistoryResponseDto = z.infer<
  typeof ImportHistoryResponseDtoSchema
>;
export type ImportResultDto = z.infer<typeof ImportResultDtoSchema>;
export type ImportedFileRefDto = z.infer<typeof ImportedFileRefDtoSchema>;
export type ImportSummaryDto = z.infer<typeof ImportSummaryDtoSchema>;
export type ImportDetailDto = z.infer<typeof ImportDetailDtoSchema>;
export type SyncImportBatchDto = z.infer<typeof SyncImportBatchDtoSchema>;
export type ImportListEntryDto = z.infer<typeof ImportListEntryDtoSchema>;
export type ImportListResponseDto = z.infer<typeof ImportListResponseDtoSchema>;
