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

export type ImportHistoryItemDto = z.infer<typeof ImportHistoryItemDtoSchema>;
export type RawActivityDataReferenceDto = z.infer<
  typeof RawActivityDataReferenceDtoSchema
>;
export type ImportHistoryResponseDto = z.infer<
  typeof ImportHistoryResponseDtoSchema
>;
export type ImportResultDto = z.infer<typeof ImportResultDtoSchema>;
