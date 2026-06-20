import { z } from 'zod';

import {
  IdSchema,
  IsoDateTimeStringSchema,
  NonNegativeIntegerSchema,
  NonNegativeNumberSchema,
  PercentageSchema,
} from './common.js';
import {
  ActivityTypeSchema,
  DataSourceTypeSchema,
  SportTypeSchema,
  SwimStrokeTypeSchema,
} from './enums.js';

export const ActivityMetricSummaryDtoSchema = z.object({
  durationSeconds: NonNegativeIntegerSchema,
  movingDurationSeconds: NonNegativeIntegerSchema.optional(),
  distanceMeters: NonNegativeIntegerSchema.optional(),
  elevationGainMeters: NonNegativeIntegerSchema.optional(),
  calories: NonNegativeIntegerSchema.optional(),
  averageHeartRateBpm: NonNegativeIntegerSchema.optional(),
  maxHeartRateBpm: NonNegativeIntegerSchema.optional(),
  averagePowerWatts: NonNegativeIntegerSchema.optional(),
  normalizedPowerWatts: NonNegativeIntegerSchema.optional(),
  averagePaceSecPerKm: NonNegativeIntegerSchema.optional(),
  averageSpeedKmh: NonNegativeNumberSchema.optional(),
  averageCadence: NonNegativeNumberSchema.optional(),
});

export const ActivitySummaryDtoSchema = z.object({
  id: IdSchema,
  title: z.string().optional(),
  sport: SportTypeSchema,
  activityType: ActivityTypeSchema.optional(),
  sourceType: DataSourceTypeSchema,
  externalId: z.string().optional(),
  startTime: IsoDateTimeStringSchema,
  timezone: z.string().optional(),
  metrics: ActivityMetricSummaryDtoSchema,
});

export const ActivityLapDtoSchema = z.object({
  lapNumber: NonNegativeIntegerSchema,
  distanceMeters: NonNegativeIntegerSchema,
  durationSeconds: NonNegativeIntegerSchema,
  averageHeartRateBpm: NonNegativeIntegerSchema.optional(),
  maxHeartRateBpm: NonNegativeIntegerSchema.optional(),
  averagePaceSecPerKm: NonNegativeIntegerSchema.optional(),
  averageSpeedKmh: NonNegativeNumberSchema.optional(),
  averagePowerWatts: NonNegativeIntegerSchema.optional(),
  averageCadence: NonNegativeNumberSchema.optional(),
  elevationGainMeters: NonNegativeIntegerSchema.optional(),
});

export const ActivitySwimLapDtoSchema = z.object({
  lapNumber: NonNegativeIntegerSchema,
  distanceMeters: NonNegativeIntegerSchema,
  durationSeconds: NonNegativeIntegerSchema,
  strokeType: SwimStrokeTypeSchema.optional(),
  strokeCount: NonNegativeIntegerSchema.optional(),
  swolfScore: NonNegativeIntegerSchema.optional(),
  averagePaceSecPer100m: NonNegativeIntegerSchema.optional(),
  averageHeartRateBpm: NonNegativeIntegerSchema.optional(),
});

export const ActivityMetricSampleDtoSchema = z.object({
  offsetSeconds: NonNegativeIntegerSchema,
  heartRateBpm: NonNegativeIntegerSchema.optional(),
  powerWatts: NonNegativeIntegerSchema.optional(),
  paceSecPerKm: NonNegativeIntegerSchema.optional(),
  swimPaceSecPer100m: NonNegativeIntegerSchema.optional(),
  speedKmh: NonNegativeNumberSchema.optional(),
  cadenceRpm: NonNegativeNumberSchema.optional(),
  elevationMeters: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const ActivityTimeInZoneDtoSchema = z.object({
  zoneNumber: NonNegativeIntegerSchema,
  zoneName: z.string().min(1),
  durationSeconds: NonNegativeIntegerSchema,
  percentage: PercentageSchema,
});

export const ActivityStrengthSetDtoSchema = z.object({
  id: IdSchema.optional(),
  externalSetId: z.string().optional(),
  setNumber: NonNegativeIntegerSchema,
  exerciseName: z.string().optional(),
  exerciseCategory: z.string().optional(),
  muscleGroup: z.string().optional(),
  reps: NonNegativeIntegerSchema.optional(),
  weightKg: NonNegativeNumberSchema.optional(),
  durationSeconds: NonNegativeIntegerSchema.optional(),
  restSeconds: NonNegativeIntegerSchema.optional(),
  notes: z.string().optional(),
});

export const ActivityStrengthExerciseDtoSchema = z.object({
  exerciseName: z.string().min(1),
  exerciseCategory: z.string().optional(),
  muscleGroup: z.string().optional(),
  sets: NonNegativeIntegerSchema,
  reps: NonNegativeIntegerSchema.optional(),
  volumeKg: NonNegativeNumberSchema.optional(),
  bestWeightKg: NonNegativeNumberSchema.optional(),
});

export const ActivityDetailDtoSchema = ActivitySummaryDtoSchema.extend({
  notes: z.string().optional(),
  perceivedExertion: NonNegativeIntegerSchema.optional(),
  intensityFactor: NonNegativeNumberSchema.optional(),
  trainingStressScore: NonNegativeNumberSchema.optional(),
  poolLengthMeters: NonNegativeIntegerSchema.optional(),
  dominantStrokeType: SwimStrokeTypeSchema.optional(),
  totalStrokeCount: NonNegativeIntegerSchema.optional(),
  averageSwolfScore: NonNegativeNumberSchema.optional(),
  totalSets: NonNegativeIntegerSchema.optional(),
  totalReps: NonNegativeIntegerSchema.optional(),
  totalVolumeKg: NonNegativeNumberSchema.optional(),
  laps: z.array(ActivityLapDtoSchema),
  swimLaps: z.array(ActivitySwimLapDtoSchema),
  metricSamples: z.array(ActivityMetricSampleDtoSchema),
  timeInZones: z.array(ActivityTimeInZoneDtoSchema),
  strengthSets: z.array(ActivityStrengthSetDtoSchema),
  strengthExercises: z.array(ActivityStrengthExerciseDtoSchema),
});

export const ActivitiesResponseDtoSchema = z.object({
  activities: z.array(ActivitySummaryDtoSchema),
});

export type ActivityMetricSummaryDto = z.infer<
  typeof ActivityMetricSummaryDtoSchema
>;
export type ActivitySummaryDto = z.infer<typeof ActivitySummaryDtoSchema>;
export type ActivityLapDto = z.infer<typeof ActivityLapDtoSchema>;
export type ActivitySwimLapDto = z.infer<typeof ActivitySwimLapDtoSchema>;
export type ActivityMetricSampleDto = z.infer<
  typeof ActivityMetricSampleDtoSchema
>;
export type ActivityTimeInZoneDto = z.infer<typeof ActivityTimeInZoneDtoSchema>;
export type ActivityStrengthSetDto = z.infer<
  typeof ActivityStrengthSetDtoSchema
>;
export type ActivityStrengthExerciseDto = z.infer<
  typeof ActivityStrengthExerciseDtoSchema
>;
export type ActivityDetailDto = z.infer<typeof ActivityDetailDtoSchema>;
export type ActivitiesResponseDto = z.infer<typeof ActivitiesResponseDtoSchema>;
