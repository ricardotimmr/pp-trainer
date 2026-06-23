import { describe, expect, it } from 'vitest';

import { normalizeActivity } from '../../import/normalizer/ActivityNormalizer.js';
import type { ParsedActivity } from '../../import/types.js';

const PROFILE_ID = 'profile-1';

const minimalParsed: ParsedActivity = {
  source: 'ManualJsonImport',
  sport: 'running',
  startTime: new Date('2026-06-22T07:30:00Z'),
  durationSeconds: 3600,
};

describe('ActivityNormalizer', () => {
  describe('required fields', () => {
    it('sets sourceType to ManualJsonImport', () => {
      const result = normalizeActivity(PROFILE_ID, minimalParsed);
      expect(result.sourceType).toBe('ManualJsonImport');
    });

    it('sets athleteProfileId', () => {
      const result = normalizeActivity(PROFILE_ID, minimalParsed);
      expect(result.athleteProfileId).toBe(PROFILE_ID);
    });

    it('maps sport string to Prisma SportType', () => {
      const result = normalizeActivity(PROFILE_ID, minimalParsed);
      expect(result.sport).toBe('Running');
    });

    it('maps all sport types correctly', () => {
      const sports: Array<[string, string]> = [
        ['cycling', 'Cycling'],
        ['running', 'Running'],
        ['swimming', 'Swimming'],
        ['strength', 'Strength'],
        ['mobility', 'Mobility'],
        ['other', 'Other'],
      ];
      for (const [input, expected] of sports) {
        const result = normalizeActivity(PROFILE_ID, { ...minimalParsed, sport: input });
        expect(result.sport).toBe(expected);
      }
    });

    it('throws for unsupported sport', () => {
      expect(() =>
        normalizeActivity(PROFILE_ID, { ...minimalParsed, sport: 'yoga' }),
      ).toThrow('Unsupported sport value');
    });

    it('sets startTime as Date', () => {
      const result = normalizeActivity(PROFILE_ID, minimalParsed);
      expect(result.startTime).toEqual(new Date('2026-06-22T07:30:00Z'));
    });

    it('sets durationSeconds', () => {
      const result = normalizeActivity(PROFILE_ID, minimalParsed);
      expect(result.durationSeconds).toBe(3600);
    });
  });

  describe('optional scalar fields', () => {
    it('generates a fallback title and omits other undefined optional fields', () => {
      const result = normalizeActivity(PROFILE_ID, minimalParsed);
      expect(typeof result.title).toBe('string');
      expect((result.title as string).length).toBeGreaterThan(0);
      expect('notes' in result).toBe(false);
      expect('distanceMeters' in result).toBe(false);
      expect('averageHeartRateBpm' in result).toBe(false);
    });

    it('maps heart rate fields with Bpm suffix', () => {
      const result = normalizeActivity(PROFILE_ID, {
        ...minimalParsed,
        averageHeartRate: 148,
        maxHeartRate: 168,
      });
      expect(result.averageHeartRateBpm).toBe(148);
      expect(result.maxHeartRateBpm).toBe(168);
    });

    it('maps common optional fields', () => {
      const result = normalizeActivity(PROFILE_ID, {
        ...minimalParsed,
        title: 'Morning run',
        notes: 'Easy pace',
        distanceMeters: 10000,
        elevationGainMeters: 50,
        averagePowerWatts: 200,
        normalizedPowerWatts: 210,
        averageCadence: 176.5,
        averageSpeedKmh: 10.0,
        calories: 500,
        perceivedExertion: 6,
      });
      expect(result.title).toBe('Morning run');
      expect(result.notes).toBe('Easy pace');
      expect(result.distanceMeters).toBe(10000);
      expect(result.elevationGainMeters).toBe(50);
      expect(result.averagePowerWatts).toBe(200);
      expect(result.normalizedPowerWatts).toBe(210);
      expect(result.averageCadence).toBe(176.5);
      expect(result.averageSpeedKmh).toBe(10.0);
      expect(result.calories).toBe(500);
      expect(result.perceivedExertion).toBe(6);
    });
  });

  describe('swimming fields', () => {
    it('maps swimming-specific fields', () => {
      const result = normalizeActivity(PROFILE_ID, {
        ...minimalParsed,
        sport: 'swimming',
        poolLengthMeters: 50,
        dominantStrokeType: 'Freestyle',
        totalStrokeCount: 1400,
      });
      expect(result.poolLengthMeters).toBe(50);
      expect(result.dominantStrokeType).toBe('Freestyle');
      expect(result.totalStrokeCount).toBe(1400);
    });
  });

  describe('strength fields', () => {
    it('maps strength-specific fields', () => {
      const result = normalizeActivity(PROFILE_ID, {
        ...minimalParsed,
        sport: 'strength',
        totalSets: 3,
        totalReps: 24,
      });
      expect(result.totalSets).toBe(3);
      expect(result.totalReps).toBe(24);
    });
  });

  describe('nested laps', () => {
    it('maps laps as Prisma nested create', () => {
      const result = normalizeActivity(PROFILE_ID, {
        ...minimalParsed,
        laps: [
          {
            lapNumber: 1,
            durationSeconds: 300,
            distanceMeters: 1000,
            averageHeartRateBpm: 145,
            averagePaceSecPerKm: 300,
          },
        ],
      });
      const laps = (result.laps as { create: unknown[] }).create;
      expect(laps).toHaveLength(1);
      expect(laps[0]).toMatchObject({ lapNumber: 1, durationSeconds: 300, distanceMeters: 1000 });
    });

    it('omits laps when empty array', () => {
      const result = normalizeActivity(PROFILE_ID, { ...minimalParsed, laps: [] });
      expect('laps' in result).toBe(false);
    });
  });

  describe('nested swimLaps', () => {
    it('maps swimLaps as Prisma nested create', () => {
      const result = normalizeActivity(PROFILE_ID, {
        ...minimalParsed,
        sport: 'swimming',
        swimLaps: [
          {
            lapNumber: 1,
            durationSeconds: 52,
            distanceMeters: 50,
            strokeType: 'Freestyle',
          },
        ],
      });
      const swimLaps = (result.swimLaps as { create: unknown[] }).create;
      expect(swimLaps).toHaveLength(1);
      expect(swimLaps[0]).toMatchObject({ lapNumber: 1, strokeType: 'Freestyle' });
    });
  });

  describe('nested strengthSets', () => {
    it('maps strengthSets as Prisma nested create', () => {
      const result = normalizeActivity(PROFILE_ID, {
        ...minimalParsed,
        sport: 'strength',
        strengthSets: [
          { setNumber: 1, exerciseName: 'Squat', reps: 8, weightKg: 80 },
        ],
      });
      const sets = (result.strengthSets as { create: unknown[] }).create;
      expect(sets).toHaveLength(1);
      expect(sets[0]).toMatchObject({ setNumber: 1, exerciseName: 'Squat', reps: 8, weightKg: 80 });
    });
  });

  describe('nested metricSamples', () => {
    it('maps metricSamples as Prisma nested create', () => {
      const result = normalizeActivity(PROFILE_ID, {
        ...minimalParsed,
        metricSamples: [
          { offsetSeconds: 60, heartRateBpm: 142, speedKmh: 10.5 },
        ],
      });
      const samples = (result.metricSamples as { create: unknown[] }).create;
      expect(samples).toHaveLength(1);
      expect(samples[0]).toMatchObject({ offsetSeconds: 60, heartRateBpm: 142, speedKmh: 10.5 });
    });
  });

  describe('nested timeInZones', () => {
    it('maps timeInZones as Prisma nested create', () => {
      const result = normalizeActivity(PROFILE_ID, {
        ...minimalParsed,
        timeInZones: [
          { zoneNumber: 3, zoneName: 'Tempo', durationSeconds: 2700, percentage: 75.0 },
        ],
      });
      const zones = (result.timeInZones as { create: unknown[] }).create;
      expect(zones).toHaveLength(1);
      expect(zones[0]).toMatchObject({ zoneNumber: 3, zoneName: 'Tempo', percentage: 75.0 });
    });
  });
});
