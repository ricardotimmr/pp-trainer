import type { ActivitySummaryDto } from '@pp-trainer/shared';
import type { Activity } from '../mock/prototypeData.types';

export function mapApiActivity(dto: ActivitySummaryDto): Activity {
  return {
    id: dto.id,
    athleteProfileId: '', // not exposed in API summary — frontend display only
    sourceType: dto.sourceType,
    externalId: dto.externalId,
    title: dto.title,
    sport: dto.sport,
    activityType: dto.activityType,
    startTime: dto.startTime,
    timezone: dto.timezone,
    durationSeconds: dto.metrics.durationSeconds,
    movingDurationSeconds: dto.metrics.movingDurationSeconds,
    distanceMeters: dto.metrics.distanceMeters,
    elevationGainMeters: dto.metrics.elevationGainMeters,
    calories: dto.metrics.calories,
    averageHeartRateBpm: dto.metrics.averageHeartRateBpm,
    maxHeartRateBpm: dto.metrics.maxHeartRateBpm,
    averagePowerWatts: dto.metrics.averagePowerWatts,
    normalizedPowerWatts: dto.metrics.normalizedPowerWatts,
    averagePaceSecPerKm: dto.metrics.averagePaceSecPerKm,
    averageSpeedKmh: dto.metrics.averageSpeedKmh,
    averageCadence: dto.metrics.averageCadence,
    createdAt: dto.startTime,
    updatedAt: dto.startTime,
  };
}
