import FitFileParser from 'fit-file-parser';
import type { SwimStrokeType } from '@prisma/client';

import type { ActivityImporter } from '../ActivityImporter.js';
import type {
  ParsedActivity,
  ParsedLap,
  ParsedMetricSample,
  ParsedSwimLap,
} from '../types.js';

// Local shapes for the fields we consume from fit-file-parser output
type FitSession = {
  start_time: string;
  sport?: string;
  sub_sport?: string;
  total_timer_time?: number;
  total_elapsed_time?: number;
  total_distance?: number;
  total_ascent?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  avg_power?: number;
  normalized_power?: number;
  avg_cadence?: number;
  avg_speed?: number;
  total_calories?: number;
  pool_length?: number;
};

type FitLap = {
  total_timer_time?: number;
  total_elapsed_time?: number;
  total_distance?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  avg_speed?: number;
  avg_power?: number;
  avg_cadence?: number;
  total_ascent?: number;
};

type FitLength = {
  length_type?: string;
  total_timer_time?: number;
  total_elapsed_time?: number;
  total_strokes?: number;
  swim_stroke?: string;
};

type FitRecord = {
  timestamp: string;
  heart_rate?: number;
  power?: number;
  cadence?: number;
  speed?: number;
  altitude?: number;
  position_lat?: number;
  position_long?: number;
};

type FitData = {
  sessions?: FitSession[];
  laps?: FitLap[];
  records?: FitRecord[];
  lengths?: FitLength[];
};

const FIT_SPORT_MAP: Record<string, string> = {
  running: 'running',
  cycling: 'cycling',
  swimming: 'swimming',
  walking: 'other',
  hiking: 'other',
  mountaineering: 'other',
  fitness_equipment: 'other',
  training: 'other',
};

function mapFitSport(sport?: string, subSport?: string): string {
  if (sport === 'fitness_equipment' && subSport === 'strength_training') return 'strength';
  return FIT_SPORT_MAP[sport ?? ''] ?? 'other';
}

const FIT_SWIM_STROKE_MAP: Record<string, SwimStrokeType> = {
  freestyle: 'Freestyle',
  backstroke: 'Backstroke',
  breaststroke: 'Breaststroke',
  butterfly: 'Butterfly',
  mixed: 'Mixed',
  drill: 'Drill',
};

const SAMPLE_INTERVAL_S = 5;

function safeDate(str: string | undefined): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function dominantStroke(swimLaps: ParsedSwimLap[]): SwimStrokeType | undefined {
  const counts = new Map<SwimStrokeType, number>();
  for (const lap of swimLaps) {
    if (lap.strokeType) counts.set(lap.strokeType, (counts.get(lap.strokeType) ?? 0) + 1);
  }
  let dominant: SwimStrokeType | undefined;
  let max = 0;
  for (const [k, v] of counts) {
    if (v > max) { max = v; dominant = k; }
  }
  return dominant;
}

export class FitParser implements ActivityImporter {
  readonly source = 'ManualFitUpload' as const;

  async parse(input: unknown): Promise<ParsedActivity> {
    if (!(input instanceof Buffer)) {
      throw new Error('FitParser requires a Buffer input');
    }

    const parser = new FitFileParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'm',
      mode: 'list',
    });

    // fit-file-parser's parseAsync signature expects Buffer<ArrayBuffer>,
    // which is a Node.js Buffer — we cast through unknown to satisfy TS
    const data = (await parser.parseAsync(input as unknown as ArrayBuffer)) as FitData;

    const session = data.sessions?.[0];
    if (session == null) {
      throw new Error('No session record found in FIT file');
    }

    const startTime = new Date(session.start_time);
    const sport = mapFitSport(session.sport, session.sub_sport);
    const isSwim = sport === 'swimming';

    const durationSeconds = Math.round(
      session.total_timer_time ?? session.total_elapsed_time ?? 0,
    );

    const swimLaps = isSwim
      ? extractSwimLaps(data.lengths ?? [], session.pool_length)
      : undefined;

    const laps = !isSwim ? extractLaps(data.laps ?? []) : undefined;

    const metricSamples = extractMetricSamples(data.records ?? [], startTime);

    const totalStrokeCount =
      isSwim && swimLaps != null
        ? swimLaps.reduce((sum, l) => sum + (l.strokeCount ?? 0), 0) || undefined
        : undefined;

    return {
      source: 'ManualFitUpload',
      sport,
      startTime,
      durationSeconds,
      distanceMeters: session.total_distance != null ? Math.round(session.total_distance) : undefined,
      elevationGainMeters: session.total_ascent != null ? Math.round(session.total_ascent) : undefined,
      averageHeartRate: session.avg_heart_rate,
      maxHeartRate: session.max_heart_rate,
      averagePowerWatts: session.avg_power,
      normalizedPowerWatts: session.normalized_power,
      averageCadence: session.avg_cadence,
      averageSpeedKmh: session.avg_speed,
      calories: session.total_calories,
      poolLengthMeters: isSwim ? session.pool_length : undefined,
      dominantStrokeType: isSwim && swimLaps ? dominantStroke(swimLaps) : undefined,
      totalStrokeCount,
      laps: laps && laps.length > 0 ? laps : undefined,
      swimLaps: swimLaps && swimLaps.length > 0 ? swimLaps : undefined,
      metricSamples: metricSamples.length > 0 ? metricSamples : undefined,
    };
  }
}

function extractLaps(fitLaps: FitLap[]): ParsedLap[] {
  return fitLaps.map((lap, i) => {
    const speedKmh = lap.avg_speed;
    const paceSecPerKm =
      speedKmh != null && speedKmh > 0 ? Math.round(3600 / speedKmh) : undefined;
    return {
      lapNumber: i + 1,
      durationSeconds: Math.round(lap.total_timer_time ?? lap.total_elapsed_time ?? 0),
      distanceMeters: Math.round(lap.total_distance ?? 0),
      averageHeartRateBpm: lap.avg_heart_rate,
      maxHeartRateBpm: lap.max_heart_rate,
      averagePaceSecPerKm: paceSecPerKm,
      averageSpeedKmh: speedKmh,
      averagePowerWatts: lap.avg_power,
      averageCadence: lap.avg_cadence,
      elevationGainMeters: lap.total_ascent != null ? Math.round(lap.total_ascent) : undefined,
    };
  });
}

function extractSwimLaps(fitLengths: FitLength[], poolLength?: number): ParsedSwimLap[] {
  return fitLengths
    .filter((l) => l.length_type === 'active')
    .map((len, i) => {
      const strokeType = len.swim_stroke ? FIT_SWIM_STROKE_MAP[len.swim_stroke] : undefined;
      const distanceMeters = poolLength ?? 0;
      const durationSeconds = Math.round(len.total_timer_time ?? len.total_elapsed_time ?? 0);
      const paceSecPer100m =
        durationSeconds > 0 && distanceMeters > 0
          ? Math.round((durationSeconds / distanceMeters) * 100)
          : undefined;
      const swolfScore =
        len.total_strokes != null && durationSeconds > 0
          ? len.total_strokes + durationSeconds
          : undefined;

      return {
        lapNumber: i + 1,
        durationSeconds,
        distanceMeters,
        strokeType,
        strokeCount: len.total_strokes,
        swolfScore,
        averagePaceSecPer100m: paceSecPer100m,
      };
    });
}

function extractMetricSamples(records: FitRecord[], sessionStart: Date): ParsedMetricSample[] {
  const samples: ParsedMetricSample[] = [];
  let lastOffsetS = -SAMPLE_INTERVAL_S;

  for (const rec of records) {
    const ts = safeDate(rec.timestamp);
    if (ts == null) continue;

    const offsetS = Math.round((ts.getTime() - sessionStart.getTime()) / 1000);
    if (offsetS < 0) continue;
    if (offsetS - lastOffsetS < SAMPLE_INTERVAL_S) continue;

    const speedKmh = rec.speed;
    const paceSecPerKm =
      speedKmh != null && speedKmh > 0 ? Math.round(3600 / speedKmh) : undefined;

    samples.push({
      offsetSeconds: offsetS,
      heartRateBpm: rec.heart_rate,
      powerWatts: rec.power,
      paceSecPerKm,
      speedKmh,
      cadenceRpm: rec.cadence,
      elevationMeters: rec.altitude,
      latitude: rec.position_lat,
      longitude: rec.position_long,
    });

    lastOffsetS = offsetS;
  }

  return samples;
}
