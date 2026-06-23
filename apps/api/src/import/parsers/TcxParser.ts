import { XMLParser } from 'fast-xml-parser';

import type { ActivityImporter } from '../ActivityImporter.js';
import type { ParsedActivity, ParsedLap, ParsedMetricSample } from '../types.js';

function toArray<T>(val: T | T[] | undefined): T[] {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

const TCX_SPORT_MAP: Record<string, string> = {
  Running: 'running',
  Biking: 'cycling',
  Swimming: 'swimming',
  Other: 'other',
};

function mapTcxSport(raw?: string): string {
  if (!raw) return 'other';
  return TCX_SPORT_MAP[raw] ?? 'other';
}

type HrValue = { Value?: number };

type TcxTrackpoint = {
  Time?: string;
  AltitudeMeters?: number;
  HeartRateBpm?: HrValue;
  Cadence?: number;
  Extensions?: {
    TPX?: {
      Speed?: number;  // m/s
      Watts?: number;
      RunCadence?: number;
    };
    [key: string]: unknown;
  };
};

type TcxTrack = { Trackpoint?: TcxTrackpoint | TcxTrackpoint[] };

type LapExtensionLX = {
  AvgSpeed?: number;
  AvgRunCadence?: number;
  MaxRunCadence?: number;
  AvgWatts?: number;
  MaxWatts?: number;
  MaxBikeCadence?: number;
};

type TcxLap = {
  '@_StartTime'?: string;
  TotalTimeSeconds?: number;
  DistanceMeters?: number;
  MaximumSpeed?: number;
  AverageHeartRateBpm?: HrValue;
  MaximumHeartRateBpm?: HrValue;
  Calories?: number;
  Cadence?: number;
  AverageCadence?: number;
  Track?: TcxTrack | TcxTrack[];
  Extensions?: {
    LX?: LapExtensionLX;
    [key: string]: unknown;
  };
};

type TcxActivity = {
  '@_Sport'?: string;
  Lap?: TcxLap | TcxLap[];
};

type TcxDoc = {
  TrainingCenterDatabase?: {
    Activities?: {
      Activity?: TcxActivity | TcxActivity[];
    };
  };
};

const SAMPLE_INTERVAL_S = 5;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: true,
  parseAttributeValue: true,
  isArray: (name) => ['Activity', 'Lap', 'Track', 'Trackpoint'].includes(name),
});

export class TcxParser implements ActivityImporter {
  readonly source = 'ManualTcxUpload' as const;

  async parse(input: unknown): Promise<ParsedActivity> {
    if (!(input instanceof Buffer)) {
      throw new Error('TcxParser requires a Buffer input');
    }

    const doc = xmlParser.parse(input) as TcxDoc;
    const activities = toArray(doc.TrainingCenterDatabase?.Activities?.Activity);

    if (activities.length === 0) {
      throw new Error('No Activity element found in TCX file');
    }

    const activity = activities[0];
    const sport = mapTcxSport(activity['@_Sport']);
    const fitLaps = toArray(activity.Lap);

    if (fitLaps.length === 0) {
      throw new Error('No Lap elements found in TCX Activity');
    }

    // Session-level aggregates from laps
    const totalDistance = fitLaps.reduce((s, l) => s + (l.DistanceMeters ?? 0), 0);
    const totalDuration = fitLaps.reduce((s, l) => s + (l.TotalTimeSeconds ?? 0), 0);
    const totalCalories = fitLaps.reduce((s, l) => s + (l.Calories ?? 0), 0);

    // All trackpoints (with per-lap grouping preserved for elevation)
    const allTrackpoints = fitLaps.flatMap((lap) =>
      toArray(lap.Track).flatMap((track) => toArray(track.Trackpoint)),
    );

    const startTime = parseFirstTime(fitLaps[0]['@_StartTime'], allTrackpoints);

    // Weighted average heart rate from laps (by duration weight)
    const avgHr = computeWeightedAvgHr(fitLaps);
    const maxHr = computeMaxHr(fitLaps);
    const avgCadence = computeAvgCadence(fitLaps);
    const avgSpeedKmh =
      totalDuration > 0 ? (totalDistance / 1000) / (totalDuration / 3600) : undefined;

    // Prefer lap-level AvgWatts from LX extensions; fall back to trackpoint average
    const avgPower = computeAvgPower(fitLaps, allTrackpoints);

    const laps = extractLaps(fitLaps);
    const metricSamples = extractTcxSamples(allTrackpoints, startTime);

    return {
      source: 'ManualTcxUpload',
      sport,
      startTime,
      durationSeconds: Math.round(totalDuration),
      distanceMeters: totalDistance > 0 ? Math.round(totalDistance) : undefined,
      averageHeartRate: avgHr,
      maxHeartRate: maxHr,
      averagePowerWatts: avgPower,
      averageCadence: avgCadence,
      averageSpeedKmh: avgSpeedKmh,
      calories: totalCalories > 0 ? totalCalories : undefined,
      laps: laps.length > 0 ? laps : undefined,
      metricSamples: metricSamples.length > 0 ? metricSamples : undefined,
    };
  }
}

function parseFirstTime(startTimeStr?: string, trackpoints?: TcxTrackpoint[]): Date {
  if (startTimeStr) {
    const d = new Date(startTimeStr);
    if (!isNaN(d.getTime())) return d;
  }
  for (const tp of trackpoints ?? []) {
    if (tp.Time) {
      const d = new Date(tp.Time);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return new Date(0);
}

function computeWeightedAvgHr(laps: TcxLap[]): number | undefined {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const lap of laps) {
    const hr = lap.AverageHeartRateBpm?.Value;
    const dur = lap.TotalTimeSeconds ?? 0;
    if (hr != null && dur > 0) {
      weightedSum += hr * dur;
      totalWeight += dur;
    }
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : undefined;
}

function computeMaxHr(laps: TcxLap[]): number | undefined {
  const values = laps
    .map((l) => l.MaximumHeartRateBpm?.Value)
    .filter((v): v is number => v != null);
  return values.length > 0 ? Math.max(...values) : undefined;
}

function computeAvgCadence(laps: TcxLap[]): number | undefined {
  // Running: AvgRunCadence in LX extension; cycling: direct Cadence on lap
  const values = laps
    .map((l) => l.Extensions?.LX?.AvgRunCadence ?? l.Cadence ?? l.AverageCadence)
    .filter((v): v is number => v != null && v > 0);
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function computeAvgPower(laps: TcxLap[], allTrackpoints: TcxTrackpoint[]): number | undefined {
  // Prefer lap-level AvgWatts (more accurate, from Garmin LX extension)
  const lapWatts = laps
    .map((l) => ({ watts: l.Extensions?.LX?.AvgWatts, dur: l.TotalTimeSeconds ?? 0 }))
    .filter((l): l is { watts: number; dur: number } => l.watts != null && l.watts > 0 && l.dur > 0);

  if (lapWatts.length > 0) {
    const totalDur = lapWatts.reduce((s, l) => s + l.dur, 0);
    const weighted = lapWatts.reduce((s, l) => s + l.watts * l.dur, 0);
    return Math.round(weighted / totalDur);
  }

  // Fall back to trackpoint-level Watts
  const tpWatts = allTrackpoints
    .map((tp) => tp.Extensions?.TPX?.Watts)
    .filter((v): v is number => v != null && v > 0);
  return tpWatts.length > 0
    ? Math.round(tpWatts.reduce((a, b) => a + b, 0) / tpWatts.length)
    : undefined;
}

function computeLapElevationGain(lap: TcxLap): number | undefined {
  const points = toArray(lap.Track).flatMap((t) => toArray(t.Trackpoint));
  let gain = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].AltitudeMeters;
    const curr = points[i].AltitudeMeters;
    if (prev != null && curr != null && curr > prev) gain += curr - prev;
  }
  return gain > 0 ? Math.round(gain) : undefined;
}

function extractLaps(fitLaps: TcxLap[]): ParsedLap[] {
  return fitLaps.map((lap, i) => {
    const durationSeconds = Math.round(lap.TotalTimeSeconds ?? 0);
    const distanceMeters = Math.round(lap.DistanceMeters ?? 0);
    const avgSpeedKmh =
      durationSeconds > 0 ? (distanceMeters / 1000) / (durationSeconds / 3600) : undefined;
    const paceSecPerKm =
      avgSpeedKmh != null && avgSpeedKmh > 0 ? Math.round(3600 / avgSpeedKmh) : undefined;

    // Cadence: running uses LX.AvgRunCadence, cycling uses direct Lap.Cadence
    const averageCadence =
      lap.Extensions?.LX?.AvgRunCadence ?? lap.Cadence ?? lap.AverageCadence ?? undefined;

    // Power: from LX.AvgWatts
    const averagePowerWatts = lap.Extensions?.LX?.AvgWatts ?? undefined;

    return {
      lapNumber: i + 1,
      durationSeconds,
      distanceMeters,
      averageHeartRateBpm: lap.AverageHeartRateBpm?.Value,
      maxHeartRateBpm: lap.MaximumHeartRateBpm?.Value,
      averagePaceSecPerKm: paceSecPerKm,
      averageSpeedKmh: avgSpeedKmh,
      ...(averageCadence != null && averageCadence > 0 && { averageCadence }),
      ...(averagePowerWatts != null && averagePowerWatts > 0 && { averagePowerWatts }),
      elevationGainMeters: computeLapElevationGain(lap),
    };
  });
}

function extractTcxSamples(
  trackpoints: TcxTrackpoint[],
  sessionStart: Date,
): ParsedMetricSample[] {
  const samples: ParsedMetricSample[] = [];
  let lastOffsetS = -SAMPLE_INTERVAL_S;

  for (const tp of trackpoints) {
    if (!tp.Time) continue;
    const ts = new Date(tp.Time);
    if (isNaN(ts.getTime())) continue;

    const offsetS = Math.round((ts.getTime() - sessionStart.getTime()) / 1000);
    if (offsetS < 0) continue;
    if (offsetS - lastOffsetS < SAMPLE_INTERVAL_S) continue;

    const tpx = tp.Extensions?.TPX;
    // Running cadence is in TPX.RunCadence; cycling cadence is on the trackpoint directly
    const cadenceRpm = tpx?.RunCadence ?? tp.Cadence;
    const powerWatts = tpx?.Watts;
    // TPX.Speed is in m/s
    const speedMs = tpx?.Speed;
    const speedKmh = speedMs != null && speedMs > 0 ? speedMs * 3.6 : undefined;
    const paceSecPerKm = speedKmh != null ? Math.round(3600 / speedKmh) : undefined;

    samples.push({
      offsetSeconds: offsetS,
      heartRateBpm: tp.HeartRateBpm?.Value,
      ...(powerWatts != null && powerWatts > 0 && { powerWatts }),
      ...(cadenceRpm != null && cadenceRpm > 0 && { cadenceRpm }),
      ...(speedKmh != null && { speedKmh }),
      ...(paceSecPerKm != null && { paceSecPerKm }),
      ...(tp.AltitudeMeters != null && { elevationMeters: tp.AltitudeMeters }),
    });

    lastOffsetS = offsetS;
  }

  return samples;
}
