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
  HeartRateBpm?: HrValue;
  Cadence?: number;
  Extensions?: {
    TPX?: { Watts?: number };
    [key: string]: unknown;
  };
};

type TcxTrack = { Trackpoint?: TcxTrackpoint | TcxTrackpoint[] };

type TcxLap = {
  '@_StartTime'?: string;
  TotalTimeSeconds?: number;
  DistanceMeters?: number;
  MaximumSpeed?: number;
  AverageHeartRateBpm?: HrValue;
  MaximumHeartRateBpm?: HrValue;
  Calories?: number;
  AverageCadence?: number;
  Track?: TcxTrack | TcxTrack[];
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

    // Collect all trackpoints for metric samples and aggregate HR/power
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

    // Average power from all trackpoints
    const powerValues = allTrackpoints
      .map((tp) => tp.Extensions?.TPX?.Watts)
      .filter((v): v is number => v != null);
    const avgPower =
      powerValues.length > 0
        ? Math.round(powerValues.reduce((a, b) => a + b, 0) / powerValues.length)
        : undefined;

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
  // Fall back to first trackpoint
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
  const values = laps.map((l) => l.AverageCadence).filter((v): v is number => v != null);
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function extractLaps(fitLaps: TcxLap[]): ParsedLap[] {
  return fitLaps.map((lap, i) => {
    const durationSeconds = Math.round(lap.TotalTimeSeconds ?? 0);
    const distanceMeters = Math.round(lap.DistanceMeters ?? 0);
    const avgSpeedKmh =
      durationSeconds > 0 ? (distanceMeters / 1000) / (durationSeconds / 3600) : undefined;
    const paceSecPerKm =
      avgSpeedKmh != null && avgSpeedKmh > 0 ? Math.round(3600 / avgSpeedKmh) : undefined;

    return {
      lapNumber: i + 1,
      durationSeconds,
      distanceMeters,
      averageHeartRateBpm: lap.AverageHeartRateBpm?.Value,
      maxHeartRateBpm: lap.MaximumHeartRateBpm?.Value,
      averagePaceSecPerKm: paceSecPerKm,
      averageSpeedKmh: avgSpeedKmh,
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

    const watts = tp.Extensions?.TPX?.Watts;

    samples.push({
      offsetSeconds: offsetS,
      heartRateBpm: tp.HeartRateBpm?.Value,
      powerWatts: watts,
      cadenceRpm: tp.Cadence,
    });

    lastOffsetS = offsetS;
  }

  return samples;
}
