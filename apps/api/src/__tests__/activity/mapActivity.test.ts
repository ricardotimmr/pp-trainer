import type {
  Activity,
  ActivityLap,
  ActivityMetricSample,
  ActivityStrengthExercise,
  ActivityStrengthSet,
  ActivitySwimLap,
  ActivityTimeInZone,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { mapActivityDetail, mapActivitySummary } from '../../mappers/mapActivity.js';
import type { ActivityWithDetails } from '../../repositories/ActivityRepository.js';

const baseActivity: Activity = {
  id: 'act-1',
  createdAt: new Date('2024-05-01T00:00:00Z'),
  updatedAt: new Date('2024-05-01T00:00:00Z'),
  athleteProfileId: 'profile-1',
  sourceType: 'Mock',
  externalId: 'ext-123',
  importedFileId: null,
  rawActivityDataId: null,
  title: 'Morning Run',
  sport: 'Running',
  activityType: 'Easy',
  startTime: new Date('2024-05-01T07:00:00Z'),
  timezone: 'Europe/Berlin',
  durationSeconds: 3600,
  movingDurationSeconds: 3540,
  distanceMeters: 10000,
  elevationGainMeters: 120,
  elevationLossMeters: 110,
  averageHeartRateBpm: 142,
  maxHeartRateBpm: 165,
  averagePowerWatts: null,
  maxPowerWatts: null,
  normalizedPowerWatts: null,
  intensityFactor: null,
  trainingStressScore: null,
  averagePaceSecPerKm: 360,
  bestPaceSecPerKm: null,
  averageSpeedKmh: new Prisma.Decimal('10.00'),
  maxSpeedKmh: null,
  averageCadence: new Prisma.Decimal('88.5'),
  calories: 620,
  perceivedExertion: null,
  notes: null,
  totalSets: null,
  totalReps: null,
  totalVolumeKg: null,
  poolLengthMeters: null,
  dominantStrokeType: null,
  totalStrokeCount: null,
  averageSwolfScore: null,
};

const emptyDetails = {
  laps: [],
  swimLaps: [],
  metricSamples: [],
  timeInZones: [],
  strengthSets: [],
  strengthExercises: [],
};

describe('mapActivitySummary', () => {
  it('maps required fields', () => {
    const dto = mapActivitySummary(baseActivity);
    expect(dto.id).toBe('act-1');
    expect(dto.startTime).toBe('2024-05-01T07:00:00.000Z');
    expect(dto.metrics.durationSeconds).toBe(3600);
  });

  it('maps SportType enum to DTO value', () => {
    expect(mapActivitySummary(baseActivity).sport).toBe('running');
    expect(mapActivitySummary({ ...baseActivity, sport: 'Cycling' }).sport).toBe('cycling');
    expect(mapActivitySummary({ ...baseActivity, sport: 'Swimming' }).sport).toBe('swimming');
    expect(mapActivitySummary({ ...baseActivity, sport: 'Strength' }).sport).toBe('strength');
  });

  it('maps ActivityType enum to DTO value', () => {
    expect(mapActivitySummary(baseActivity).activityType).toBe('easy');
    expect(mapActivitySummary({ ...baseActivity, activityType: 'Vo2Max' }).activityType).toBe('vo2max');
  });

  it('maps DataSourceType enum to DTO value', () => {
    expect(mapActivitySummary(baseActivity).sourceType).toBe('mock');
    expect(mapActivitySummary({ ...baseActivity, sourceType: 'GarminUnofficial' }).sourceType).toBe('garmin_unofficial');
  });

  it('converts Decimal metrics to numbers', () => {
    const dto = mapActivitySummary(baseActivity);
    expect(dto.metrics.averageSpeedKmh).toBe(10);
    expect(dto.metrics.averageCadence).toBe(88.5);
  });

  it('omits absent optional metrics', () => {
    const dto = mapActivitySummary({
      ...baseActivity,
      movingDurationSeconds: null,
      distanceMeters: null,
      averageHeartRateBpm: null,
      averagePowerWatts: null,
      averagePaceSecPerKm: null,
      averageSpeedKmh: null,
      averageCadence: null,
      calories: null,
    });
    expect('movingDurationSeconds' in dto.metrics).toBe(false);
    expect('distanceMeters' in dto.metrics).toBe(false);
    expect('averageHeartRateBpm' in dto.metrics).toBe(false);
    expect('averageSpeedKmh' in dto.metrics).toBe(false);
  });

  it('omits absent optional activity fields', () => {
    const dto = mapActivitySummary({ ...baseActivity, title: null, activityType: null, externalId: null, timezone: null });
    expect('title' in dto).toBe(false);
    expect('activityType' in dto).toBe(false);
    expect('externalId' in dto).toBe(false);
    expect('timezone' in dto).toBe(false);
  });
});

describe('mapActivityDetail — sport branches', () => {
  it('cycling activity includes power metrics', () => {
    const cycling: ActivityWithDetails = {
      ...baseActivity,
      sport: 'Cycling',
      averagePowerWatts: 220,
      normalizedPowerWatts: 235,
      intensityFactor: new Prisma.Decimal('0.824'),
      trainingStressScore: new Prisma.Decimal('68.50'),
      ...emptyDetails,
      laps: [
        {
          id: 'lap-1',
          activityId: 'act-1',
          lapNumber: 1,
          distanceMeters: 5000,
          durationSeconds: 800,
          averageHeartRateBpm: 155,
          maxHeartRateBpm: null,
          averagePaceSecPerKm: null,
          averageSpeedKmh: new Prisma.Decimal('22.5'),
          averagePowerWatts: 225,
          averageCadence: new Prisma.Decimal('91.0'),
          elevationGainMeters: 40,
        } as ActivityLap,
      ],
    };
    const dto = mapActivityDetail(cycling);
    expect(dto.metrics.averagePowerWatts).toBe(220);
    expect(dto.metrics.normalizedPowerWatts).toBe(235);
    expect(dto.intensityFactor).toBe(0.824);
    expect(dto.trainingStressScore).toBe(68.5);
    expect(dto.laps).toHaveLength(1);
    expect(dto.laps[0].lapNumber).toBe(1);
    expect(dto.laps[0].averageSpeedKmh).toBe(22.5);
  });

  it('swimming activity includes swim lap and stroke data', () => {
    const swimming: ActivityWithDetails = {
      ...baseActivity,
      sport: 'Swimming',
      poolLengthMeters: 25,
      dominantStrokeType: 'Freestyle',
      totalStrokeCount: 840,
      averageSwolfScore: new Prisma.Decimal('36.2'),
      ...emptyDetails,
      swimLaps: [
        {
          id: 'sl-1',
          activityId: 'act-1',
          lapNumber: 1,
          distanceMeters: 50,
          durationSeconds: 46,
          strokeType: 'Freestyle',
          strokeCount: 42,
          swolfScore: 88,
          averagePaceSecPer100m: 92,
          averageHeartRateBpm: 138,
        } as ActivitySwimLap,
      ],
    };
    const dto = mapActivityDetail(swimming);
    expect(dto.poolLengthMeters).toBe(25);
    expect(dto.dominantStrokeType).toBe('freestyle');
    expect(dto.averageSwolfScore).toBe(36.2);
    expect(dto.swimLaps).toHaveLength(1);
    expect(dto.swimLaps[0].strokeType).toBe('freestyle');
    expect(dto.swimLaps[0].swolfScore).toBe(88);
  });

  it('strength activity includes sets and exercises', () => {
    const strength: ActivityWithDetails = {
      ...baseActivity,
      sport: 'Strength',
      totalSets: 12,
      totalReps: 96,
      totalVolumeKg: new Prisma.Decimal('2880.00'),
      ...emptyDetails,
      strengthSets: [
        {
          id: 'ss-1',
          activityId: 'act-1',
          externalSetId: null,
          setNumber: 1,
          exerciseName: 'Squat',
          exerciseCategory: 'Legs',
          muscleGroup: 'Quadriceps',
          reps: 8,
          weightKg: new Prisma.Decimal('100.0'),
          durationSeconds: null,
          restSeconds: 120,
          notes: null,
        } as ActivityStrengthSet,
      ],
      strengthExercises: [
        {
          id: 'se-1',
          activityId: 'act-1',
          exerciseName: 'Squat',
          exerciseCategory: 'Legs',
          muscleGroup: 'Quadriceps',
          sets: 4,
          reps: 8,
          volumeKg: new Prisma.Decimal('3200.0'),
          bestWeightKg: new Prisma.Decimal('110.0'),
        } as ActivityStrengthExercise,
      ],
    };
    const dto = mapActivityDetail(strength);
    expect(dto.totalSets).toBe(12);
    expect(dto.totalVolumeKg).toBe(2880);
    expect(dto.strengthSets).toHaveLength(1);
    expect(dto.strengthSets[0].exerciseName).toBe('Squat');
    expect(dto.strengthSets[0].weightKg).toBe(100);
    expect(dto.strengthExercises[0].volumeKg).toBe(3200);
    expect(dto.strengthExercises[0].bestWeightKg).toBe(110);
  });

  it('activity with time-series samples preserves all fields', () => {
    const withSamples: ActivityWithDetails = {
      ...baseActivity,
      ...emptyDetails,
      metricSamples: [
        {
          id: 's-1',
          activityId: 'act-1',
          offsetSeconds: 0,
          heartRateBpm: 130,
          powerWatts: null,
          paceSecPerKm: 360,
          swimPaceSecPer100m: null,
          speedKmh: new Prisma.Decimal('10.0'),
          cadenceRpm: new Prisma.Decimal('88.0'),
          elevationMeters: new Prisma.Decimal('120.5'),
          latitude: new Prisma.Decimal('52.520008'),
          longitude: new Prisma.Decimal('13.404954'),
        } as ActivityMetricSample,
      ],
      timeInZones: [
        {
          id: 'tz-1',
          activityId: 'act-1',
          zoneNumber: 2,
          zoneName: 'Z2 Aerobic',
          durationSeconds: 2400,
          percentage: new Prisma.Decimal('66.67'),
        } as ActivityTimeInZone,
      ],
    };
    const dto = mapActivityDetail(withSamples);
    expect(dto.metricSamples).toHaveLength(1);
    expect(dto.metricSamples[0].heartRateBpm).toBe(130);
    expect(dto.metricSamples[0].speedKmh).toBe(10);
    expect(dto.metricSamples[0].elevationMeters).toBe(120.5);
    expect(dto.metricSamples[0].latitude).toBe(52.520008);
    expect(dto.timeInZones[0].percentage).toBe(66.67);
    expect(dto.timeInZones[0].zoneName).toBe('Z2 Aerobic');
  });

  it('activity with no optional fields returns empty arrays and no extra keys', () => {
    const minimal: ActivityWithDetails = {
      ...baseActivity,
      title: null,
      activityType: null,
      externalId: null,
      timezone: null,
      movingDurationSeconds: null,
      distanceMeters: null,
      elevationGainMeters: null,
      elevationLossMeters: null,
      averageHeartRateBpm: null,
      maxHeartRateBpm: null,
      averagePowerWatts: null,
      maxPowerWatts: null,
      normalizedPowerWatts: null,
      intensityFactor: null,
      trainingStressScore: null,
      averagePaceSecPerKm: null,
      bestPaceSecPerKm: null,
      averageSpeedKmh: null,
      maxSpeedKmh: null,
      averageCadence: null,
      calories: null,
      perceivedExertion: null,
      notes: null,
      totalSets: null,
      totalReps: null,
      totalVolumeKg: null,
      poolLengthMeters: null,
      dominantStrokeType: null,
      totalStrokeCount: null,
      averageSwolfScore: null,
      ...emptyDetails,
    };
    const dto = mapActivityDetail(minimal);
    expect(dto.laps).toEqual([]);
    expect(dto.swimLaps).toEqual([]);
    expect(dto.metricSamples).toEqual([]);
    expect(dto.timeInZones).toEqual([]);
    expect(dto.strengthSets).toEqual([]);
    expect(dto.strengthExercises).toEqual([]);
    expect('title' in dto).toBe(false);
    expect('activityType' in dto).toBe(false);
    expect('notes' in dto).toBe(false);
    expect('poolLengthMeters' in dto).toBe(false);
  });
});
