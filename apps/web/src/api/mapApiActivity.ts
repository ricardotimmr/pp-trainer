import type { ActivityDetailDto, ActivitySummaryDto } from '@pp-trainer/shared';
import type { Activity } from '../types/domain';

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

export function mapApiActivityDetail(dto: ActivityDetailDto): Activity {
  return {
    ...mapApiActivity(dto),
    notes: dto.notes,
    perceivedExertion: dto.perceivedExertion,
    intensityFactor: dto.intensityFactor,
    trainingStressScore: dto.trainingStressScore,
    poolLengthMeters: dto.poolLengthMeters,
    dominantStrokeType: dto.dominantStrokeType,
    totalStrokeCount: dto.totalStrokeCount,
    avgSwolfScore: dto.averageSwolfScore,
    totalSets: dto.totalSets,
    totalReps: dto.totalReps,
    totalVolumeKg: dto.totalVolumeKg,
    laps: dto.laps.length > 0 ? dto.laps : undefined,
    swimLaps: dto.swimLaps.length > 0 ? dto.swimLaps : undefined,
    timeSeries: dto.metricSamples.length > 0 ? dto.metricSamples : undefined,
    timeInHrZones: dto.timeInZones.length > 0 ? dto.timeInZones : undefined,
    strengthSets: dto.strengthSets.length > 0 ? dto.strengthSets : undefined,
    strengthExercises: dto.strengthExercises.length > 0 ? dto.strengthExercises : undefined,
  };
}
