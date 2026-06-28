import { z } from 'zod';

import type { ParsedActivity } from '../types.js';

// ── Strava raw activity schema ────────────────────────────────────────────────

export const StravaActivityRawSchema = z.object({
  id:                       z.number(),
  name:                     z.string(),
  sport_type:               z.string().optional(),
  type:                     z.string().optional(),
  start_date:               z.string(),
  moving_time:              z.number(),
  distance:                 z.number().optional(),
  total_elevation_gain:     z.number().optional(),
  average_heartrate:        z.number().optional(),
  max_heartrate:            z.number().optional(),
  average_watts:            z.number().optional(),
  weighted_average_watts:   z.number().optional(),
  average_cadence:          z.number().optional(),
  average_speed:            z.number().optional(),
  kilojoules:               z.number().optional(),
  description:              z.string().optional().nullable(),
});

export type StravaActivityRaw = z.infer<typeof StravaActivityRawSchema>;

// ── Sport mapping ─────────────────────────────────────────────────────────────

const SPORT_MAP: Record<string, string> = {
  Run:                'running',
  'Trail Run':        'running',
  Ride:               'cycling',
  'Virtual Ride':     'cycling',
  'Gravel Ride':      'cycling',
  'Mountain Bike Ride': 'cycling',
  Swim:               'swimming',
  'Weight Training':  'strength',
  Workout:            'strength',
  Yoga:               'mobility',
  Pilates:            'mobility',
  Stretching:         'mobility',
};

function mapSport(type: string): string {
  return SPORT_MAP[type] ?? 'other';
}

// ── Mapper ────────────────────────────────────────────────────────────────────

export function mapStravaActivity(raw: StravaActivityRaw): ParsedActivity {
  const sportString = raw.sport_type ?? raw.type ?? '';
  return {
    source:                'Strava',
    externalId:            String(raw.id),
    sport:                 mapSport(sportString),
    startTime:             new Date(raw.start_date),
    durationSeconds:       raw.moving_time,
    title:                 raw.name,
    notes:                 raw.description ?? undefined,
    distanceMeters:        raw.distance,
    elevationGainMeters:   raw.total_elevation_gain,
    averageHeartRate:      raw.average_heartrate,
    maxHeartRate:          raw.max_heartrate,
    averagePowerWatts:     raw.average_watts,
    normalizedPowerWatts:  raw.weighted_average_watts,
    averageCadence:        raw.average_cadence,
    averageSpeedKmh:       raw.average_speed != null ? raw.average_speed * 3.6 : undefined,
    calories:              raw.kilojoules != null ? raw.kilojoules * 0.239 : undefined,
  };
}
