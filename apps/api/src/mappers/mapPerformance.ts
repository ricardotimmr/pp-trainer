import type { PerformanceSportMetric, RacePrediction } from '@prisma/client';
import type { PerformanceSportMetricDto, RacePredictionDto } from '@pp-trainer/shared';

import { SPORT_TYPE_MAP } from './enumMaps.js';

export function mapPerformanceSportMetric(
  metric: PerformanceSportMetric,
): PerformanceSportMetricDto {
  return {
    sport: SPORT_TYPE_MAP[metric.sport],
    ...(metric.vo2maxEstimate != null && { vo2maxEstimate: Number(metric.vo2maxEstimate) }),
    ...(metric.vo2maxEstimatedAt != null && {
      vo2maxEstimatedAt: metric.vo2maxEstimatedAt.toISOString(),
    }),
    ...(metric.thresholdHeartRateBpm != null && {
      thresholdHeartRateBpm: metric.thresholdHeartRateBpm,
    }),
    ...(metric.thresholdHeartRateEstimatedAt != null && {
      thresholdHeartRateEstimatedAt: metric.thresholdHeartRateEstimatedAt.toISOString(),
    }),
    ...(metric.thresholdPaceSecPerKm != null && {
      thresholdPaceSecPerKm: metric.thresholdPaceSecPerKm,
    }),
    ...(metric.thresholdPaceSecPer100m != null && {
      thresholdPaceSecPer100m: metric.thresholdPaceSecPer100m,
    }),
    ...(metric.thresholdPaceEstimatedAt != null && {
      thresholdPaceEstimatedAt: metric.thresholdPaceEstimatedAt.toISOString(),
    }),
    ...(metric.ftpWatts != null && { ftpWatts: metric.ftpWatts }),
    ...(metric.ftpEstimatedAt != null && { ftpEstimatedAt: metric.ftpEstimatedAt.toISOString() }),
  };
}

export function mapRacePrediction(pred: RacePrediction): RacePredictionDto {
  return {
    sport: SPORT_TYPE_MAP[pred.sport],
    distanceLabel: pred.distanceLabel,
    distanceMeters: pred.distanceMeters,
    predictedDurationSeconds: pred.predictedDurationSeconds,
    ...(pred.predictedPaceSecPerKm != null && {
      predictedPaceSecPerKm: pred.predictedPaceSecPerKm,
    }),
    ...(pred.predictedSpeedKmh != null && {
      predictedSpeedKmh: Number(pred.predictedSpeedKmh),
    }),
    estimatedAt: pred.estimatedAt.toISOString(),
  };
}
