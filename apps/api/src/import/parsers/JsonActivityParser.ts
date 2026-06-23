import { ActivityJsonImportRequestSchema } from '@pp-trainer/shared';

import { DTO_TO_PRISMA_SWIM_STROKE_MAP } from '../../mappers/enumMaps.js';
import { type ActivityImporter } from '../ActivityImporter.js';
import type { ParsedActivity } from '../types.js';

export class JsonActivityParser implements ActivityImporter {
  readonly source = 'ManualJsonImport' as const;

  async parse(input: unknown): Promise<ParsedActivity> {
    const body = ActivityJsonImportRequestSchema.parse(input);

    return {
      source: this.source,
      sport: body.sport,
      startTime: new Date(body.startTime),
      durationSeconds: body.durationSeconds,
      title: body.title,
      notes: body.notes,
      distanceMeters: body.distanceMeters,
      elevationGainMeters: body.elevationGainMeters,
      averageHeartRate: body.averageHeartRate,
      maxHeartRate: body.maxHeartRate,
      averagePowerWatts: body.averagePowerWatts,
      normalizedPowerWatts: body.normalizedPowerWatts,
      averageCadence: body.averageCadence,
      averageSpeedKmh: body.averageSpeedKmh,
      calories: body.calories,
      perceivedExertion: body.perceivedExertion,
      poolLengthMeters: body.poolLengthMeters,
      dominantStrokeType:
        body.dominantStrokeType != null
          ? DTO_TO_PRISMA_SWIM_STROKE_MAP[body.dominantStrokeType]
          : undefined,
      totalStrokeCount: body.totalStrokeCount,
      totalSets: body.totalSets,
      totalReps: body.totalReps,
      laps: body.laps?.map((l) => ({
        lapNumber: l.lapNumber,
        durationSeconds: l.durationSeconds,
        distanceMeters: l.distanceMeters,
        averageHeartRateBpm: l.averageHeartRateBpm,
        maxHeartRateBpm: l.maxHeartRateBpm,
        averagePaceSecPerKm: l.averagePaceSecPerKm,
        averageSpeedKmh: l.averageSpeedKmh,
        averagePowerWatts: l.averagePowerWatts,
        averageCadence: l.averageCadence,
        elevationGainMeters: l.elevationGainMeters,
      })),
      swimLaps: body.swimLaps?.map((sl) => ({
        lapNumber: sl.lapNumber,
        durationSeconds: sl.durationSeconds,
        distanceMeters: sl.distanceMeters,
        strokeType:
          sl.strokeType != null ? DTO_TO_PRISMA_SWIM_STROKE_MAP[sl.strokeType] : undefined,
        strokeCount: sl.strokeCount,
        swolfScore: sl.swolfScore,
        averagePaceSecPer100m: sl.averagePaceSecPer100m,
        averageHeartRateBpm: sl.averageHeartRateBpm,
      })),
      strengthSets: body.strengthSets?.map((ss) => ({
        setNumber: ss.setNumber,
        exerciseName: ss.exerciseName,
        exerciseCategory: ss.exerciseCategory,
        muscleGroup: ss.muscleGroup,
        reps: ss.reps,
        weightKg: ss.weightKg,
        durationSeconds: ss.durationSeconds,
        restSeconds: ss.restSeconds,
        notes: ss.notes,
      })),
      metricSamples: body.metricSamples?.map((ms) => ({
        offsetSeconds: ms.offsetSeconds,
        heartRateBpm: ms.heartRateBpm,
        powerWatts: ms.powerWatts,
        paceSecPerKm: ms.paceSecPerKm,
        swimPaceSecPer100m: ms.swimPaceSecPer100m,
        speedKmh: ms.speedKmh,
        cadenceRpm: ms.cadenceRpm,
        elevationMeters: ms.elevationMeters,
        latitude: ms.latitude,
        longitude: ms.longitude,
      })),
      timeInZones: body.timeInZones?.map((tz) => ({
        zoneNumber: tz.zoneNumber,
        zoneName: tz.zoneName,
        durationSeconds: tz.durationSeconds,
        percentage: tz.percentage,
      })),
    };
  }
}
