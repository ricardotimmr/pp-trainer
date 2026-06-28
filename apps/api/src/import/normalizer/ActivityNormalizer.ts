import type { Prisma } from '@prisma/client';

import { DTO_TO_PRISMA_SPORT_MAP } from '../../mappers/enumMaps.js';
import type { ParsedActivity } from '../types.js';

export type NormalizedActivity = Prisma.ActivityUncheckedCreateInput;

const SPORT_DEFAULT_TITLE: Record<string, string> = {
  running: 'Run',
  cycling: 'Bike Ride',
  swimming: 'Swim',
  strength: 'Strength Training',
  mobility: 'Mobility',
  other: 'Activity',
};

function generateTitle(sport: string, startTime: Date): string {
  const hour = startTime.getUTCHours();
  const timeOfDay = hour < 11 ? 'Morning' : hour < 15 ? 'Afternoon' : hour < 20 ? 'Evening' : 'Night';
  const sportLabel = SPORT_DEFAULT_TITLE[sport] ?? 'Activity';
  return `${timeOfDay} ${sportLabel}`;
}

export function normalizeActivity(
  athleteProfileId: string,
  parsed: ParsedActivity,
): NormalizedActivity {
  const sport = DTO_TO_PRISMA_SPORT_MAP[parsed.sport as keyof typeof DTO_TO_PRISMA_SPORT_MAP];

  if (sport == null) {
    throw new Error(`Unsupported sport value: '${parsed.sport}'`);
  }

  return {
    athleteProfileId,
    sourceType: parsed.source,
    ...(parsed.externalId != null && { externalId: parsed.externalId }),
    sport,
    startTime: parsed.startTime,
    durationSeconds: parsed.durationSeconds,
    title: parsed.title?.trim() || generateTitle(parsed.sport, parsed.startTime),
    ...(parsed.notes != null && { notes: parsed.notes }),
    ...(parsed.distanceMeters != null && { distanceMeters: parsed.distanceMeters }),
    ...(parsed.elevationGainMeters != null && { elevationGainMeters: parsed.elevationGainMeters }),
    ...(parsed.averageHeartRate != null && { averageHeartRateBpm: parsed.averageHeartRate }),
    ...(parsed.maxHeartRate != null && { maxHeartRateBpm: parsed.maxHeartRate }),
    ...(parsed.averagePowerWatts != null && { averagePowerWatts: parsed.averagePowerWatts }),
    ...(parsed.normalizedPowerWatts != null && {
      normalizedPowerWatts: parsed.normalizedPowerWatts,
    }),
    ...(parsed.averageCadence != null && { averageCadence: parsed.averageCadence }),
    ...(parsed.averageSpeedKmh != null && { averageSpeedKmh: parsed.averageSpeedKmh }),
    ...(parsed.calories != null && { calories: parsed.calories }),
    ...(parsed.perceivedExertion != null && { perceivedExertion: parsed.perceivedExertion }),
    // swimming
    ...(parsed.poolLengthMeters != null && { poolLengthMeters: parsed.poolLengthMeters }),
    ...(parsed.dominantStrokeType != null && { dominantStrokeType: parsed.dominantStrokeType }),
    ...(parsed.totalStrokeCount != null && { totalStrokeCount: parsed.totalStrokeCount }),
    // strength
    ...(parsed.totalSets != null && { totalSets: parsed.totalSets }),
    ...(parsed.totalReps != null && { totalReps: parsed.totalReps }),
    // nested
    ...(parsed.laps != null &&
      parsed.laps.length > 0 && {
        laps: {
          create: parsed.laps.map((l) => ({
            lapNumber: l.lapNumber,
            durationSeconds: l.durationSeconds,
            distanceMeters: l.distanceMeters,
            ...(l.averageHeartRateBpm != null && { averageHeartRateBpm: l.averageHeartRateBpm }),
            ...(l.maxHeartRateBpm != null && { maxHeartRateBpm: l.maxHeartRateBpm }),
            ...(l.averagePaceSecPerKm != null && { averagePaceSecPerKm: l.averagePaceSecPerKm }),
            ...(l.averageSpeedKmh != null && { averageSpeedKmh: l.averageSpeedKmh }),
            ...(l.averagePowerWatts != null && { averagePowerWatts: l.averagePowerWatts }),
            ...(l.averageCadence != null && { averageCadence: l.averageCadence }),
            ...(l.elevationGainMeters != null && { elevationGainMeters: l.elevationGainMeters }),
          })),
        },
      }),
    ...(parsed.swimLaps != null &&
      parsed.swimLaps.length > 0 && {
        swimLaps: {
          create: parsed.swimLaps.map((sl) => ({
            lapNumber: sl.lapNumber,
            durationSeconds: sl.durationSeconds,
            distanceMeters: sl.distanceMeters,
            ...(sl.strokeType != null && { strokeType: sl.strokeType }),
            ...(sl.strokeCount != null && { strokeCount: sl.strokeCount }),
            ...(sl.swolfScore != null && { swolfScore: sl.swolfScore }),
            ...(sl.averagePaceSecPer100m != null && {
              averagePaceSecPer100m: sl.averagePaceSecPer100m,
            }),
            ...(sl.averageHeartRateBpm != null && { averageHeartRateBpm: sl.averageHeartRateBpm }),
          })),
        },
      }),
    ...(parsed.strengthSets != null &&
      parsed.strengthSets.length > 0 && {
        strengthSets: {
          create: parsed.strengthSets.map((ss) => ({
            setNumber: ss.setNumber,
            ...(ss.exerciseName != null && { exerciseName: ss.exerciseName }),
            ...(ss.exerciseCategory != null && { exerciseCategory: ss.exerciseCategory }),
            ...(ss.muscleGroup != null && { muscleGroup: ss.muscleGroup }),
            ...(ss.reps != null && { reps: ss.reps }),
            ...(ss.weightKg != null && { weightKg: ss.weightKg }),
            ...(ss.durationSeconds != null && { durationSeconds: ss.durationSeconds }),
            ...(ss.restSeconds != null && { restSeconds: ss.restSeconds }),
            ...(ss.notes != null && { notes: ss.notes }),
          })),
        },
      }),
    ...(parsed.metricSamples != null &&
      parsed.metricSamples.length > 0 && {
        metricSamples: {
          create: parsed.metricSamples.map((ms) => ({
            offsetSeconds: ms.offsetSeconds,
            ...(ms.heartRateBpm != null && { heartRateBpm: ms.heartRateBpm }),
            ...(ms.powerWatts != null && { powerWatts: ms.powerWatts }),
            ...(ms.paceSecPerKm != null && { paceSecPerKm: ms.paceSecPerKm }),
            ...(ms.swimPaceSecPer100m != null && { swimPaceSecPer100m: ms.swimPaceSecPer100m }),
            ...(ms.speedKmh != null && { speedKmh: ms.speedKmh }),
            ...(ms.cadenceRpm != null && { cadenceRpm: ms.cadenceRpm }),
            ...(ms.elevationMeters != null && { elevationMeters: ms.elevationMeters }),
            ...(ms.latitude != null && { latitude: ms.latitude }),
            ...(ms.longitude != null && { longitude: ms.longitude }),
          })),
        },
      }),
    ...(parsed.timeInZones != null &&
      parsed.timeInZones.length > 0 && {
        timeInZones: {
          create: parsed.timeInZones.map((tz) => ({
            zoneNumber: tz.zoneNumber,
            zoneName: tz.zoneName,
            durationSeconds: tz.durationSeconds,
            percentage: tz.percentage,
          })),
        },
      }),
  };
}
