import type {
  Activity,
  ActivityLap,
  ActivityMetricSample,
  ActivityStrengthExercise,
  ActivityStrengthSet,
  ActivitySwimLap,
  ActivityTimeInZone,
} from '@prisma/client';
import type {
  ActivityDetailDto,
  ActivityLapDto,
  ActivityMetricSampleDto,
  ActivityStrengthExerciseDto,
  ActivityStrengthSetDto,
  ActivitySummaryDto,
  ActivitySwimLapDto,
  ActivityTimeInZoneDto,
} from '@pp-trainer/shared';

import type { ActivityWithDetails } from '../repositories/ActivityRepository.js';
import {
  ACTIVITY_TYPE_MAP,
  DATA_SOURCE_TYPE_MAP,
  SPORT_TYPE_MAP,
  SWIM_STROKE_TYPE_MAP,
} from './enumMaps.js';

function mapActivityLap(lap: ActivityLap): ActivityLapDto {
  return {
    lapNumber: lap.lapNumber,
    distanceMeters: lap.distanceMeters,
    durationSeconds: lap.durationSeconds,
    ...(lap.averageHeartRateBpm != null && { averageHeartRateBpm: lap.averageHeartRateBpm }),
    ...(lap.maxHeartRateBpm != null && { maxHeartRateBpm: lap.maxHeartRateBpm }),
    ...(lap.averagePaceSecPerKm != null && { averagePaceSecPerKm: lap.averagePaceSecPerKm }),
    ...(lap.averageSpeedKmh != null && { averageSpeedKmh: Number(lap.averageSpeedKmh) }),
    ...(lap.averagePowerWatts != null && { averagePowerWatts: lap.averagePowerWatts }),
    ...(lap.averageCadence != null && { averageCadence: Number(lap.averageCadence) }),
    ...(lap.elevationGainMeters != null && { elevationGainMeters: lap.elevationGainMeters }),
  };
}

function mapActivitySwimLap(lap: ActivitySwimLap): ActivitySwimLapDto {
  return {
    lapNumber: lap.lapNumber,
    distanceMeters: lap.distanceMeters,
    durationSeconds: lap.durationSeconds,
    ...(lap.strokeType != null && { strokeType: SWIM_STROKE_TYPE_MAP[lap.strokeType] }),
    ...(lap.strokeCount != null && { strokeCount: lap.strokeCount }),
    ...(lap.swolfScore != null && { swolfScore: lap.swolfScore }),
    ...(lap.averagePaceSecPer100m != null && { averagePaceSecPer100m: lap.averagePaceSecPer100m }),
    ...(lap.averageHeartRateBpm != null && { averageHeartRateBpm: lap.averageHeartRateBpm }),
  };
}

function mapActivityMetricSample(sample: ActivityMetricSample): ActivityMetricSampleDto {
  return {
    offsetSeconds: sample.offsetSeconds,
    ...(sample.heartRateBpm != null && { heartRateBpm: sample.heartRateBpm }),
    ...(sample.powerWatts != null && { powerWatts: sample.powerWatts }),
    ...(sample.paceSecPerKm != null && { paceSecPerKm: sample.paceSecPerKm }),
    ...(sample.swimPaceSecPer100m != null && { swimPaceSecPer100m: sample.swimPaceSecPer100m }),
    ...(sample.speedKmh != null && { speedKmh: Number(sample.speedKmh) }),
    ...(sample.cadenceRpm != null && { cadenceRpm: Number(sample.cadenceRpm) }),
    ...(sample.elevationMeters != null && { elevationMeters: Number(sample.elevationMeters) }),
    ...(sample.latitude != null && { latitude: Number(sample.latitude) }),
    ...(sample.longitude != null && { longitude: Number(sample.longitude) }),
  };
}

function mapActivityTimeInZone(zone: ActivityTimeInZone): ActivityTimeInZoneDto {
  return {
    zoneNumber: zone.zoneNumber,
    zoneName: zone.zoneName,
    durationSeconds: zone.durationSeconds,
    percentage: Number(zone.percentage),
  };
}

function mapActivityStrengthSet(set: ActivityStrengthSet): ActivityStrengthSetDto {
  return {
    id: set.id,
    setNumber: set.setNumber,
    ...(set.externalSetId != null && { externalSetId: set.externalSetId }),
    ...(set.exerciseName != null && { exerciseName: set.exerciseName }),
    ...(set.exerciseCategory != null && { exerciseCategory: set.exerciseCategory }),
    ...(set.muscleGroup != null && { muscleGroup: set.muscleGroup }),
    ...(set.reps != null && { reps: set.reps }),
    ...(set.weightKg != null && { weightKg: Number(set.weightKg) }),
    ...(set.durationSeconds != null && { durationSeconds: set.durationSeconds }),
    ...(set.restSeconds != null && { restSeconds: set.restSeconds }),
    ...(set.notes != null && { notes: set.notes }),
  };
}

function mapActivityStrengthExercise(ex: ActivityStrengthExercise): ActivityStrengthExerciseDto {
  return {
    exerciseName: ex.exerciseName,
    ...(ex.exerciseCategory != null && { exerciseCategory: ex.exerciseCategory }),
    ...(ex.muscleGroup != null && { muscleGroup: ex.muscleGroup }),
    sets: ex.sets,
    ...(ex.reps != null && { reps: ex.reps }),
    ...(ex.volumeKg != null && { volumeKg: Number(ex.volumeKg) }),
    ...(ex.bestWeightKg != null && { bestWeightKg: Number(ex.bestWeightKg) }),
  };
}

export function mapActivitySummary(activity: Activity): ActivitySummaryDto {
  return {
    id: activity.id,
    ...(activity.title != null && { title: activity.title }),
    sport: SPORT_TYPE_MAP[activity.sport],
    ...(activity.activityType != null && { activityType: ACTIVITY_TYPE_MAP[activity.activityType] }),
    sourceType: DATA_SOURCE_TYPE_MAP[activity.sourceType],
    ...(activity.externalId != null && { externalId: activity.externalId }),
    startTime: activity.startTime.toISOString(),
    ...(activity.timezone != null && { timezone: activity.timezone }),
    metrics: {
      durationSeconds: activity.durationSeconds,
      ...(activity.movingDurationSeconds != null && {
        movingDurationSeconds: activity.movingDurationSeconds,
      }),
      ...(activity.distanceMeters != null && { distanceMeters: activity.distanceMeters }),
      ...(activity.elevationGainMeters != null && {
        elevationGainMeters: activity.elevationGainMeters,
      }),
      ...(activity.calories != null && { calories: activity.calories }),
      ...(activity.averageHeartRateBpm != null && {
        averageHeartRateBpm: activity.averageHeartRateBpm,
      }),
      ...(activity.maxHeartRateBpm != null && { maxHeartRateBpm: activity.maxHeartRateBpm }),
      ...(activity.averagePowerWatts != null && { averagePowerWatts: activity.averagePowerWatts }),
      ...(activity.normalizedPowerWatts != null && {
        normalizedPowerWatts: activity.normalizedPowerWatts,
      }),
      ...(activity.averagePaceSecPerKm != null && {
        averagePaceSecPerKm: activity.averagePaceSecPerKm,
      }),
      ...(activity.averageSpeedKmh != null && { averageSpeedKmh: Number(activity.averageSpeedKmh) }),
      ...(activity.averageCadence != null && { averageCadence: Number(activity.averageCadence) }),
    },
  };
}

export function mapActivityDetail(activity: ActivityWithDetails): ActivityDetailDto {
  return {
    ...mapActivitySummary(activity),
    ...(activity.notes != null && { notes: activity.notes }),
    ...(activity.perceivedExertion != null && { perceivedExertion: activity.perceivedExertion }),
    ...(activity.intensityFactor != null && { intensityFactor: Number(activity.intensityFactor) }),
    ...(activity.trainingStressScore != null && {
      trainingStressScore: Number(activity.trainingStressScore),
    }),
    ...(activity.poolLengthMeters != null && { poolLengthMeters: activity.poolLengthMeters }),
    ...(activity.dominantStrokeType != null && {
      dominantStrokeType: SWIM_STROKE_TYPE_MAP[activity.dominantStrokeType],
    }),
    ...(activity.totalStrokeCount != null && { totalStrokeCount: activity.totalStrokeCount }),
    ...(activity.averageSwolfScore != null && {
      averageSwolfScore: Number(activity.averageSwolfScore),
    }),
    ...(activity.totalSets != null && { totalSets: activity.totalSets }),
    ...(activity.totalReps != null && { totalReps: activity.totalReps }),
    ...(activity.totalVolumeKg != null && { totalVolumeKg: Number(activity.totalVolumeKg) }),
    laps: activity.laps.map(mapActivityLap),
    swimLaps: activity.swimLaps.map(mapActivitySwimLap),
    metricSamples: activity.metricSamples.map(mapActivityMetricSample),
    timeInZones: activity.timeInZones.map(mapActivityTimeInZone),
    strengthSets: activity.strengthSets.map(mapActivityStrengthSet),
    strengthExercises: activity.strengthExercises.map(mapActivityStrengthExercise),
  };
}
