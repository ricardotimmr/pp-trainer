import { describe, expect, it } from 'vitest';

import { JsonActivityParser } from '../../import/parsers/JsonActivityParser.js';

const parser = new JsonActivityParser();

const minimalBody = {
  athleteProfileId: 'profile-1',
  sport: 'running',
  startTime: '2026-06-22T07:30:00Z',
  durationSeconds: 3600,
};

const fullRunningBody = {
  ...minimalBody,
  title: 'Morning tempo run',
  notes: 'Felt great',
  distanceMeters: 12000,
  elevationGainMeters: 95,
  averageHeartRate: 148,
  maxHeartRate: 168,
  averageCadence: 176.5,
  averageSpeedKmh: 11.2,
  calories: 680,
  perceivedExertion: 7,
  laps: [
    {
      lapNumber: 1,
      durationSeconds: 300,
      distanceMeters: 1000,
      averageHeartRateBpm: 142,
      averagePaceSecPerKm: 300,
      elevationGainMeters: 5,
    },
  ],
  timeInZones: [
    { zoneNumber: 3, zoneName: 'Tempo', durationSeconds: 2700, percentage: 75.0 },
  ],
};

const swimBody = {
  athleteProfileId: 'profile-1',
  sport: 'swimming',
  startTime: '2026-06-22T06:00:00Z',
  durationSeconds: 1800,
  distanceMeters: 2000,
  poolLengthMeters: 50,
  dominantStrokeType: 'freestyle',
  totalStrokeCount: 1400,
  swimLaps: [
    {
      lapNumber: 1,
      durationSeconds: 52,
      distanceMeters: 50,
      strokeType: 'freestyle',
      strokeCount: 36,
      swolfScore: 88,
      averagePaceSecPer100m: 104,
    },
  ],
};

const strengthBody = {
  athleteProfileId: 'profile-1',
  sport: 'strength',
  startTime: '2026-06-22T09:00:00Z',
  durationSeconds: 3600,
  totalSets: 3,
  totalReps: 24,
  strengthSets: [
    {
      setNumber: 1,
      exerciseName: 'Squat',
      exerciseCategory: 'legs',
      muscleGroup: 'quads',
      reps: 8,
      weightKg: 80,
      durationSeconds: 45,
      restSeconds: 120,
    },
  ],
};

describe('JsonActivityParser', () => {
  it('has source ManualJsonImport', () => {
    expect(parser.source).toBe('ManualJsonImport');
  });

  describe('minimal running activity', () => {
    it('parses required fields', async () => {
      const result = await parser.parse(minimalBody);
      expect(result.source).toBe('ManualJsonImport');
      expect(result.sport).toBe('running');
      expect(result.startTime).toEqual(new Date('2026-06-22T07:30:00Z'));
      expect(result.durationSeconds).toBe(3600);
    });

    it('leaves optional fields undefined', async () => {
      const result = await parser.parse(minimalBody);
      expect(result.title).toBeUndefined();
      expect(result.distanceMeters).toBeUndefined();
      expect(result.laps).toBeUndefined();
    });
  });

  describe('full running activity', () => {
    it('maps all scalar fields', async () => {
      const result = await parser.parse(fullRunningBody);
      expect(result.title).toBe('Morning tempo run');
      expect(result.notes).toBe('Felt great');
      expect(result.distanceMeters).toBe(12000);
      expect(result.elevationGainMeters).toBe(95);
      expect(result.averageHeartRate).toBe(148);
      expect(result.maxHeartRate).toBe(168);
      expect(result.averageCadence).toBe(176.5);
      expect(result.averageSpeedKmh).toBe(11.2);
      expect(result.calories).toBe(680);
      expect(result.perceivedExertion).toBe(7);
    });

    it('maps laps correctly', async () => {
      const result = await parser.parse(fullRunningBody);
      expect(result.laps).toHaveLength(1);
      expect(result.laps![0].lapNumber).toBe(1);
      expect(result.laps![0].durationSeconds).toBe(300);
      expect(result.laps![0].distanceMeters).toBe(1000);
      expect(result.laps![0].averageHeartRateBpm).toBe(142);
      expect(result.laps![0].averagePaceSecPerKm).toBe(300);
      expect(result.laps![0].elevationGainMeters).toBe(5);
    });

    it('maps timeInZones correctly', async () => {
      const result = await parser.parse(fullRunningBody);
      expect(result.timeInZones).toHaveLength(1);
      expect(result.timeInZones![0].zoneNumber).toBe(3);
      expect(result.timeInZones![0].zoneName).toBe('Tempo');
      expect(result.timeInZones![0].percentage).toBe(75.0);
    });
  });

  describe('swimming activity', () => {
    it('maps swimming-specific fields', async () => {
      const result = await parser.parse(swimBody);
      expect(result.poolLengthMeters).toBe(50);
      expect(result.dominantStrokeType).toBe('Freestyle');
      expect(result.totalStrokeCount).toBe(1400);
    });

    it('maps swimLaps with stroke type conversion', async () => {
      const result = await parser.parse(swimBody);
      expect(result.swimLaps).toHaveLength(1);
      expect(result.swimLaps![0].strokeType).toBe('Freestyle');
      expect(result.swimLaps![0].strokeCount).toBe(36);
      expect(result.swimLaps![0].swolfScore).toBe(88);
      expect(result.swimLaps![0].averagePaceSecPer100m).toBe(104);
    });
  });

  describe('strength activity', () => {
    it('maps strength-specific fields', async () => {
      const result = await parser.parse(strengthBody);
      expect(result.totalSets).toBe(3);
      expect(result.totalReps).toBe(24);
    });

    it('maps strengthSets correctly', async () => {
      const result = await parser.parse(strengthBody);
      expect(result.strengthSets).toHaveLength(1);
      const set = result.strengthSets![0];
      expect(set.setNumber).toBe(1);
      expect(set.exerciseName).toBe('Squat');
      expect(set.reps).toBe(8);
      expect(set.weightKg).toBe(80);
      expect(set.restSeconds).toBe(120);
    });
  });

  describe('validation', () => {
    it('throws ZodError for missing required fields', async () => {
      await expect(parser.parse({ sport: 'running' })).rejects.toThrow();
    });

    it('throws ZodError for invalid sport value', async () => {
      await expect(
        parser.parse({ ...minimalBody, sport: 'yoga' }),
      ).rejects.toThrow();
    });

    it('throws ZodError for invalid durationSeconds', async () => {
      await expect(
        parser.parse({ ...minimalBody, durationSeconds: 0 }),
      ).rejects.toThrow();
    });

    it('throws ZodError for invalid perceivedExertion', async () => {
      await expect(
        parser.parse({ ...minimalBody, perceivedExertion: 11 }),
      ).rejects.toThrow();
    });
  });
});
