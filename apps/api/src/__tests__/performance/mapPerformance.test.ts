import { Prisma } from '@prisma/client';
import type { PerformanceSportMetric, RacePrediction } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { mapPerformanceSportMetric, mapRacePrediction } from '../../mappers/mapPerformance.js';

const baseMetric: PerformanceSportMetric = {
  id: 'metric-1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  athleteProfileId: 'profile-1',
  sport: 'Running',
  vo2maxEstimate: new Prisma.Decimal('58.5'),
  vo2maxEstimatedAt: new Date('2024-05-01T10:00:00Z'),
  thresholdHeartRateBpm: 168,
  thresholdHeartRateEstimatedAt: new Date('2024-05-01T10:00:00Z'),
  thresholdPaceSecPerKm: 255,
  thresholdPaceSecPer100m: null,
  thresholdPaceEstimatedAt: new Date('2024-05-01T10:00:00Z'),
  ftpWatts: null,
  ftpEstimatedAt: null,
};

const basePrediction: RacePrediction = {
  id: 'pred-1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  athleteProfileId: 'profile-1',
  sport: 'Running',
  distanceLabel: '10 km',
  distanceMeters: 10000,
  predictedDurationSeconds: 2550,
  predictedPaceSecPerKm: 255,
  predictedSpeedKmh: null,
  estimatedAt: new Date('2024-05-01T10:00:00Z'),
};

describe('mapPerformanceSportMetric', () => {
  it('maps required field sport', () => {
    const dto = mapPerformanceSportMetric(baseMetric);
    expect(dto.sport).toBe('running');
  });

  it('maps all sport types', () => {
    expect(mapPerformanceSportMetric({ ...baseMetric, sport: 'Cycling' }).sport).toBe('cycling');
    expect(mapPerformanceSportMetric({ ...baseMetric, sport: 'Swimming' }).sport).toBe('swimming');
    expect(mapPerformanceSportMetric({ ...baseMetric, sport: 'Strength' }).sport).toBe('strength');
    expect(mapPerformanceSportMetric({ ...baseMetric, sport: 'Mobility' }).sport).toBe('mobility');
    expect(mapPerformanceSportMetric({ ...baseMetric, sport: 'Other' }).sport).toBe('other');
  });

  it('converts Decimal vo2maxEstimate to number', () => {
    const dto = mapPerformanceSportMetric(baseMetric);
    expect(dto.vo2maxEstimate).toBe(58.5);
    expect(typeof dto.vo2maxEstimate).toBe('number');
  });

  it('formats datetime fields as ISO strings', () => {
    const dto = mapPerformanceSportMetric(baseMetric);
    expect(dto.vo2maxEstimatedAt).toBe('2024-05-01T10:00:00.000Z');
    expect(dto.thresholdHeartRateEstimatedAt).toBe('2024-05-01T10:00:00.000Z');
    expect(dto.thresholdPaceEstimatedAt).toBe('2024-05-01T10:00:00.000Z');
  });

  it('includes thresholdPaceSecPerKm for running', () => {
    const dto = mapPerformanceSportMetric(baseMetric);
    expect(dto.thresholdPaceSecPerKm).toBe(255);
  });

  it('omits thresholdPaceSecPer100m when null (no swim threshold on running metric)', () => {
    const dto = mapPerformanceSportMetric(baseMetric);
    expect('thresholdPaceSecPer100m' in dto).toBe(false);
  });

  it('includes thresholdPaceSecPer100m for swimming metric', () => {
    const dto = mapPerformanceSportMetric({
      ...baseMetric,
      sport: 'Swimming',
      thresholdPaceSecPerKm: null,
      thresholdPaceSecPer100m: 98,
    });
    expect(dto.thresholdPaceSecPer100m).toBe(98);
    expect('thresholdPaceSecPerKm' in dto).toBe(false);
  });

  it('includes ftpWatts for cycling metric', () => {
    const dto = mapPerformanceSportMetric({
      ...baseMetric,
      sport: 'Cycling',
      ftpWatts: 280,
      ftpEstimatedAt: new Date('2024-04-15T08:00:00Z'),
    });
    expect(dto.ftpWatts).toBe(280);
    expect(dto.ftpEstimatedAt).toBe('2024-04-15T08:00:00.000Z');
  });

  it('omits ftpWatts when null (no fake default)', () => {
    const dto = mapPerformanceSportMetric(baseMetric);
    expect('ftpWatts' in dto).toBe(false);
    expect('ftpEstimatedAt' in dto).toBe(false);
  });

  it('omits all optional fields when all null', () => {
    const dto = mapPerformanceSportMetric({
      ...baseMetric,
      vo2maxEstimate: null,
      vo2maxEstimatedAt: null,
      thresholdHeartRateBpm: null,
      thresholdHeartRateEstimatedAt: null,
      thresholdPaceSecPerKm: null,
      thresholdPaceSecPer100m: null,
      thresholdPaceEstimatedAt: null,
      ftpWatts: null,
      ftpEstimatedAt: null,
    });
    expect(Object.keys(dto)).toEqual(['sport']);
  });
});

describe('mapRacePrediction', () => {
  it('maps required fields', () => {
    const dto = mapRacePrediction(basePrediction);
    expect(dto.sport).toBe('running');
    expect(dto.distanceLabel).toBe('10 km');
    expect(dto.distanceMeters).toBe(10000);
    expect(dto.predictedDurationSeconds).toBe(2550);
    expect(dto.estimatedAt).toBe('2024-05-01T10:00:00.000Z');
  });

  it('maps all sport types for race predictions', () => {
    expect(mapRacePrediction({ ...basePrediction, sport: 'Cycling' }).sport).toBe('cycling');
    expect(mapRacePrediction({ ...basePrediction, sport: 'Swimming' }).sport).toBe('swimming');
  });

  it('includes predictedPaceSecPerKm for running predictions', () => {
    const dto = mapRacePrediction(basePrediction);
    expect(dto.predictedPaceSecPerKm).toBe(255);
  });

  it('omits predictedPaceSecPerKm when null (cycling/swim use speed)', () => {
    const dto = mapRacePrediction({ ...basePrediction, sport: 'Cycling', predictedPaceSecPerKm: null });
    expect('predictedPaceSecPerKm' in dto).toBe(false);
  });

  it('converts Decimal predictedSpeedKmh to number', () => {
    const dto = mapRacePrediction({
      ...basePrediction,
      sport: 'Cycling',
      predictedPaceSecPerKm: null,
      predictedSpeedKmh: new Prisma.Decimal('42.5'),
    });
    expect(dto.predictedSpeedKmh).toBe(42.5);
    expect(typeof dto.predictedSpeedKmh).toBe('number');
  });

  it('omits predictedSpeedKmh when null', () => {
    const dto = mapRacePrediction(basePrediction);
    expect('predictedSpeedKmh' in dto).toBe(false);
  });

  it('maps swimming prediction with no pace or speed', () => {
    const dto = mapRacePrediction({
      ...basePrediction,
      sport: 'Swimming',
      distanceLabel: '1500 m',
      distanceMeters: 1500,
      predictedDurationSeconds: 1260,
      predictedPaceSecPerKm: null,
      predictedSpeedKmh: null,
    });
    expect(dto.sport).toBe('swimming');
    expect(dto.distanceMeters).toBe(1500);
    expect('predictedPaceSecPerKm' in dto).toBe(false);
    expect('predictedSpeedKmh' in dto).toBe(false);
  });
});
