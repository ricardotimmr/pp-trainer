import { z } from 'zod';

import {
  IsoDateTimeStringSchema,
  NonNegativeIntegerSchema,
  NonNegativeNumberSchema,
} from './common.js';
import { SportTypeSchema } from './enums.js';

export const PerformanceSportMetricDtoSchema = z.object({
  sport: SportTypeSchema,
  vo2maxEstimate: NonNegativeNumberSchema.optional(),
  vo2maxEstimatedAt: IsoDateTimeStringSchema.optional(),
  thresholdHeartRateBpm: NonNegativeIntegerSchema.optional(),
  thresholdHeartRateEstimatedAt: IsoDateTimeStringSchema.optional(),
  thresholdPaceSecPerKm: NonNegativeIntegerSchema.optional(),
  thresholdPaceSecPer100m: NonNegativeIntegerSchema.optional(),
  thresholdPaceEstimatedAt: IsoDateTimeStringSchema.optional(),
  ftpWatts: NonNegativeIntegerSchema.optional(),
  ftpEstimatedAt: IsoDateTimeStringSchema.optional(),
});

export const RacePredictionDtoSchema = z.object({
  sport: SportTypeSchema,
  distanceLabel: z.string().min(1),
  distanceMeters: NonNegativeIntegerSchema,
  predictedDurationSeconds: NonNegativeIntegerSchema,
  predictedPaceSecPerKm: NonNegativeIntegerSchema.optional(),
  predictedSpeedKmh: NonNegativeNumberSchema.optional(),
  estimatedAt: IsoDateTimeStringSchema,
});

export const PerformanceStatsDtoSchema = z.object({
  sportMetrics: z.array(PerformanceSportMetricDtoSchema),
  racePredictions: z.array(RacePredictionDtoSchema),
});

export type PerformanceSportMetricDto = z.infer<
  typeof PerformanceSportMetricDtoSchema
>;
export type RacePredictionDto = z.infer<typeof RacePredictionDtoSchema>;
export type PerformanceStatsDto = z.infer<typeof PerformanceStatsDtoSchema>;
