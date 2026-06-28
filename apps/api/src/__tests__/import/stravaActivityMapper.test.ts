import { describe, expect, it } from 'vitest';

import {
  mapStravaActivity,
  StravaActivityRawSchema,
} from '../../import/mappers/StravaActivityMapper.js';

const BASE_RAW = {
  id: 12345678,
  name: 'Morning Run',
  sport_type: 'Run',
  type: 'Run',
  start_date: '2024-03-15T07:00:00Z',
  moving_time: 3600,
  distance: 10000,
  total_elevation_gain: 50,
  average_heartrate: 145,
  max_heartrate: 172,
  average_cadence: 88,
  average_speed: 2.778,
  kilojoules: 900,
  description: 'Great run',
};

describe('StravaActivityRawSchema', () => {
  it('parses a full valid activity', () => {
    const result = StravaActivityRawSchema.safeParse(BASE_RAW);
    expect(result.success).toBe(true);
  });

  it('allows optional fields to be absent', () => {
    const minimal = { id: 1, name: 'Test', sport_type: 'Run', start_date: '2024-01-01T00:00:00Z', moving_time: 600 };
    const result = StravaActivityRawSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('accepts activity with only sport_type (no deprecated type)', () => {
    const raw = { id: 1, name: 'Run', sport_type: 'Trail Run', start_date: '2024-01-01T00:00:00Z', moving_time: 600 };
    const result = StravaActivityRawSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it('allows description to be null', () => {
    const result = StravaActivityRawSchema.safeParse({ ...BASE_RAW, description: null });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { name: _n, ...noName } = BASE_RAW;
    expect(StravaActivityRawSchema.safeParse(noName).success).toBe(false);
  });

  it('prefers sport_type over deprecated type when both present', () => {
    const raw = StravaActivityRawSchema.parse({ ...BASE_RAW, sport_type: 'Ride', type: 'Run' });
    const result = mapStravaActivity(raw);
    expect(result.sport).toBe('cycling');
  });
});

describe('mapStravaActivity — sport mapping', () => {
  const map = (type: string) => mapStravaActivity(StravaActivityRawSchema.parse({ ...BASE_RAW, sport_type: type, type }));

  it('maps Run → running',               () => expect(map('Run').sport).toBe('running'));
  it('maps Trail Run → running',         () => expect(map('Trail Run').sport).toBe('running'));
  it('maps Ride → cycling',              () => expect(map('Ride').sport).toBe('cycling'));
  it('maps Virtual Ride → cycling',      () => expect(map('Virtual Ride').sport).toBe('cycling'));
  it('maps Gravel Ride → cycling',       () => expect(map('Gravel Ride').sport).toBe('cycling'));
  it('maps Mountain Bike Ride → cycling',() => expect(map('Mountain Bike Ride').sport).toBe('cycling'));
  it('maps Swim → swimming',             () => expect(map('Swim').sport).toBe('swimming'));
  it('maps Weight Training → strength',  () => expect(map('Weight Training').sport).toBe('strength'));
  it('maps Workout → strength',          () => expect(map('Workout').sport).toBe('strength'));
  it('maps Yoga → mobility',             () => expect(map('Yoga').sport).toBe('mobility'));
  it('maps Pilates → mobility',          () => expect(map('Pilates').sport).toBe('mobility'));
  it('maps Stretching → mobility',       () => expect(map('Stretching').sport).toBe('mobility'));
  it('maps unknown type → other',        () => expect(map('Kayaking').sport).toBe('other'));
});

describe('mapStravaActivity — field mapping', () => {
  it('sets source to Strava', () => {
    const result = mapStravaActivity(StravaActivityRawSchema.parse(BASE_RAW));
    expect(result.source).toBe('Strava');
  });

  it('converts id to externalId string', () => {
    const result = mapStravaActivity(StravaActivityRawSchema.parse(BASE_RAW));
    expect(result.externalId).toBe('12345678');
  });

  it('parses startTime as Date', () => {
    const result = mapStravaActivity(StravaActivityRawSchema.parse(BASE_RAW));
    expect(result.startTime).toBeInstanceOf(Date);
    expect(result.startTime.toISOString()).toBe('2024-03-15T07:00:00.000Z');
  });

  it('passes moving_time as durationSeconds', () => {
    const result = mapStravaActivity(StravaActivityRawSchema.parse(BASE_RAW));
    expect(result.durationSeconds).toBe(3600);
  });

  it('passes name as title', () => {
    const result = mapStravaActivity(StravaActivityRawSchema.parse(BASE_RAW));
    expect(result.title).toBe('Morning Run');
  });

  it('passes description as notes', () => {
    const result = mapStravaActivity(StravaActivityRawSchema.parse(BASE_RAW));
    expect(result.notes).toBe('Great run');
  });

  it('sets notes to undefined when description is null', () => {
    const result = mapStravaActivity(StravaActivityRawSchema.parse({ ...BASE_RAW, description: null }));
    expect(result.notes).toBeUndefined();
  });

  it('converts average_speed m/s → km/h', () => {
    const result = mapStravaActivity(StravaActivityRawSchema.parse(BASE_RAW));
    expect(result.averageSpeedKmh).toBeCloseTo(2.778 * 3.6, 3);
  });

  it('converts kilojoules → kcal', () => {
    const result = mapStravaActivity(StravaActivityRawSchema.parse(BASE_RAW));
    expect(result.calories).toBeCloseTo(900 * 0.239, 3);
  });

  it('passes optional fields as undefined when absent', () => {
    const minimal = StravaActivityRawSchema.parse({
      id: 1, name: 'Test', type: 'Run', start_date: '2024-01-01T00:00:00Z', moving_time: 600,
    });
    const result = mapStravaActivity(minimal);
    expect(result.averageSpeedKmh).toBeUndefined();
    expect(result.calories).toBeUndefined();
    expect(result.averageHeartRate).toBeUndefined();
    expect(result.distanceMeters).toBeUndefined();
    expect(result.elevationGainMeters).toBeUndefined();
  });

  it('passes watts fields through directly', () => {
    const raw = StravaActivityRawSchema.parse({ ...BASE_RAW, average_watts: 220, weighted_average_watts: 235 });
    const result = mapStravaActivity(raw);
    expect(result.averagePowerWatts).toBe(220);
    expect(result.normalizedPowerWatts).toBe(235);
  });
});
