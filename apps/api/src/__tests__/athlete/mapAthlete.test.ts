import type { AthleteProfile, TrainingAvailability, TrainingGoal } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  mapAthleteProfile,
  mapTrainingAvailability,
  mapTrainingGoal,
  mapTrainingZoneSet,
} from '../../mappers/mapAthlete.js';
import type { ZoneSetWithZones } from '../../repositories/AthleteRepository.js';

const baseProfile: AthleteProfile = {
  id: 'profile-1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-02-01T00:00:00Z'),
  displayName: 'Test Athlete',
  birthYear: 1990,
  bodyWeightKg: new Prisma.Decimal('72.5'),
  heightCm: 178,
  primarySports: ['Cycling', 'Running'],
  currentFtpWatts: 280,
  cyclingThresholdHrBpm: null,
  maxHeartRateBpm: 185,
  restingHeartRateBpm: 48,
  runningThresholdHrBpm: null,
  runningThresholdPaceSecPerKm: 270,
  swimmingThresholdPaceSecPer100m: null,
  notes: 'Test notes',
};

describe('mapAthleteProfile', () => {
  it('maps required fields correctly', () => {
    const dto = mapAthleteProfile(baseProfile);
    expect(dto.id).toBe('profile-1');
    expect(dto.displayName).toBe('Test Athlete');
    expect(dto.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2024-02-01T00:00:00.000Z');
  });

  it('maps Prisma SportType enum values to DTO values', () => {
    const dto = mapAthleteProfile(baseProfile);
    expect(dto.primarySports).toEqual(['cycling', 'running']);
  });

  it('maps Decimal bodyWeightKg to number', () => {
    const dto = mapAthleteProfile(baseProfile);
    expect(dto.bodyWeightKg).toBe(72.5);
  });

  it('includes present threshold fields', () => {
    const dto = mapAthleteProfile(baseProfile);
    expect(dto.thresholds.currentFtpWatts).toBe(280);
    expect(dto.thresholds.maxHeartRateBpm).toBe(185);
    expect(dto.thresholds.restingHeartRateBpm).toBe(48);
    expect(dto.thresholds.runningThresholdPaceSecPerKm).toBe(270);
  });

  it('omits absent threshold fields', () => {
    const dto = mapAthleteProfile(baseProfile);
    expect('swimmingThresholdPaceSecPer100m' in dto.thresholds).toBe(false);
  });

  it('omits optional profile fields when null', () => {
    const minimal: AthleteProfile = {
      ...baseProfile,
      birthYear: null,
      bodyWeightKg: null,
      heightCm: null,
      currentFtpWatts: null,
      maxHeartRateBpm: null,
      restingHeartRateBpm: null,
      runningThresholdPaceSecPerKm: null,
      swimmingThresholdPaceSecPer100m: null,
      notes: null,
    };
    const dto = mapAthleteProfile(minimal);
    expect('birthYear' in dto).toBe(false);
    expect('bodyWeightKg' in dto).toBe(false);
    expect('heightCm' in dto).toBe(false);
    expect('notes' in dto).toBe(false);
    expect(dto.thresholds).toEqual({});
  });
});

describe('mapTrainingGoal', () => {
  const baseGoal: TrainingGoal = {
    id: 'goal-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    athleteProfileId: 'profile-1',
    title: 'Run a marathon',
    goalType: 'Race',
    targetDate: new Date('2024-10-06T00:00:00Z'),
    sport: 'Running',
    priority: 'MainGoal',
    targetDistanceMeters: 42195,
    targetDurationSeconds: null,
    targetPaceSecPerKm: null,
    targetPowerWatts: null,
    targetSwimPaceSecPer100m: null,
    description: 'My A race',
    isActive: true,
  };

  it('maps GoalPriority enum values to DTO values', () => {
    expect(mapTrainingGoal({ ...baseGoal, priority: 'MainGoal' }).priority).toBe('main_goal');
    expect(mapTrainingGoal({ ...baseGoal, priority: 'SecondaryGoal' }).priority).toBe('secondary_goal');
    expect(mapTrainingGoal({ ...baseGoal, priority: 'Watchlist' }).priority).toBe('watchlist');
  });

  it('maps TrainingGoalType enum values to DTO values', () => {
    expect(mapTrainingGoal({ ...baseGoal, goalType: 'Race' }).goalType).toBe('race');
    expect(mapTrainingGoal({ ...baseGoal, goalType: 'Performance' }).goalType).toBe('performance');
    expect(mapTrainingGoal({ ...baseGoal, goalType: 'Fitness' }).goalType).toBe('fitness');
  });

  it('formats targetDate as YYYY-MM-DD', () => {
    const dto = mapTrainingGoal(baseGoal);
    expect(dto.targetDate).toBe('2024-10-06');
  });

  it('omits absent optional fields', () => {
    const dto = mapTrainingGoal({ ...baseGoal, targetDate: null, sport: null, description: null });
    expect('targetDate' in dto).toBe(false);
    expect('sport' in dto).toBe(false);
    expect('description' in dto).toBe(false);
  });
});

describe('mapTrainingAvailability', () => {
  const baseAvail: TrainingAvailability = {
    id: 'avail-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    athleteProfileId: 'profile-1',
    weekday: 'Monday',
    available: true,
    maxDurationMinutes: 90,
    preferredSports: ['Running'],
    notes: null,
  };

  it('maps Weekday enum values to DTO values', () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
    const expected = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach((day, i) => {
      expect(mapTrainingAvailability({ ...baseAvail, weekday: day }).weekday).toBe(expected[i]);
    });
  });

  it('maps preferredSports correctly', () => {
    const dto = mapTrainingAvailability(baseAvail);
    expect(dto.preferredSports).toEqual(['running']);
  });

  it('omits notes when null', () => {
    const dto = mapTrainingAvailability(baseAvail);
    expect('notes' in dto).toBe(false);
  });
});

describe('mapTrainingZoneSet', () => {
  const baseZoneSet: ZoneSetWithZones = {
    id: 'zs-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    athleteProfileId: 'profile-1',
    sport: 'Cycling',
    zoneType: 'CyclingPower',
    name: 'Cycling Power Zones',
    basedOn: 'FTP 280W',
    isActive: true,
    zones: [
      {
        id: 'z-1',
        trainingZoneSetId: 'zs-1',
        zoneNumber: 1,
        name: 'Z1 Recovery',
        lowerBound: null,
        upperBound: 139,
        unit: 'Watts',
        description: null,
      },
    ],
  };

  it('maps TrainingZoneType enum values to DTO values', () => {
    expect(mapTrainingZoneSet({ ...baseZoneSet, zoneType: 'HeartRate' }).zoneType).toBe('heart_rate');
    expect(mapTrainingZoneSet({ ...baseZoneSet, zoneType: 'CyclingPower' }).zoneType).toBe('cycling_power');
    expect(mapTrainingZoneSet({ ...baseZoneSet, zoneType: 'RunningPace' }).zoneType).toBe('running_pace');
    expect(mapTrainingZoneSet({ ...baseZoneSet, zoneType: 'SwimmingPace' }).zoneType).toBe('swimming_pace');
    expect(mapTrainingZoneSet({ ...baseZoneSet, zoneType: 'PerceivedEffort' }).zoneType).toBe('perceived_effort');
  });

  it('maps TrainingZoneUnit enum values to DTO values', () => {
    const units = ['Bpm', 'Watts', 'SecPerKm', 'SecPer100m', 'Rpe'] as const;
    const expected = ['bpm', 'watts', 'sec_per_km', 'sec_per_100m', 'rpe'];
    units.forEach((unit, i) => {
      const zoneSet = { ...baseZoneSet, zones: [{ ...baseZoneSet.zones[0], unit }] };
      expect(mapTrainingZoneSet(zoneSet).zones[0].unit).toBe(expected[i]);
    });
  });

  it('omits absent zone bounds', () => {
    const dto = mapTrainingZoneSet(baseZoneSet);
    expect('lowerBound' in dto.zones[0]).toBe(false);
    expect(dto.zones[0].upperBound).toBe(139);
  });

  it('omits sport when null', () => {
    const dto = mapTrainingZoneSet({ ...baseZoneSet, sport: null });
    expect('sport' in dto).toBe(false);
  });
});
