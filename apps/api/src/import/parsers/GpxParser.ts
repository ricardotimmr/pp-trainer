import { XMLParser } from 'fast-xml-parser';

import type { ActivityImporter } from '../ActivityImporter.js';
import type { ParsedActivity, ParsedMetricSample } from '../types.js';

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toArray<T>(val: T | T[] | undefined): T[] {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

const SPORT_MAP: Record<string, string> = {
  running: 'running',
  run: 'running',
  cycling: 'cycling',
  biking: 'cycling',
  bike: 'cycling',
  swimming: 'swimming',
  swim: 'swimming',
  strength_training: 'strength',
};

function mapGpxSport(raw?: string): string {
  if (!raw) return 'other';
  return SPORT_MAP[raw.toLowerCase()] ?? 'other';
}

type GpxTrkpt = {
  '@_lat'?: number;
  '@_lon'?: number;
  ele?: number;
  time?: string;
  extensions?: {
    TrackPointExtension?: { hr?: number; cad?: number };
    [key: string]: unknown;
  };
};

type GpxTrkseg = { trkpt?: GpxTrkpt | GpxTrkpt[] };
type GpxTrk = { name?: string; type?: string; trkseg?: GpxTrkseg | GpxTrkseg[] };
type GpxDoc = { gpx?: { trk?: GpxTrk | GpxTrk[] } };

const SAMPLE_INTERVAL_S = 5;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: true,
  parseAttributeValue: true,
  isArray: (name) => ['trk', 'trkseg', 'trkpt'].includes(name),
});

export class GpxParser implements ActivityImporter {
  readonly source = 'ManualGpxUpload' as const;

  async parse(input: unknown): Promise<ParsedActivity> {
    if (!(input instanceof Buffer)) {
      throw new Error('GpxParser requires a Buffer input');
    }

    const doc = xmlParser.parse(input) as GpxDoc;
    const trks = toArray(doc.gpx?.trk);

    if (trks.length === 0) {
      throw new Error('No track element found in GPX file');
    }

    const trk = trks[0];
    const sport = mapGpxSport(trk.type);

    // Collect all trackpoints across all segments
    const points: GpxTrkpt[] = toArray(trk.trkseg).flatMap((seg) => toArray(seg.trkpt));

    if (points.length === 0) {
      throw new Error('No trackpoints found in GPX file');
    }

    // Parse timestamps
    const times = points.map((p) => (p.time ? new Date(p.time) : null));
    const validTimes = times.filter((t): t is Date => t != null && !isNaN(t.getTime()));

    const startTime = validTimes[0] ?? new Date(0);
    const endTime = validTimes[validTimes.length - 1] ?? startTime;
    const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    // Distance from Haversine
    let distanceMeters = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      if (
        prev['@_lat'] != null &&
        prev['@_lon'] != null &&
        curr['@_lat'] != null &&
        curr['@_lon'] != null
      ) {
        distanceMeters += haversineMeters(
          prev['@_lat'],
          prev['@_lon'],
          curr['@_lat'],
          curr['@_lon'],
        );
      }
    }

    // Elevation gain from positive deltas
    let elevationGainMeters = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1].ele;
      const curr = points[i].ele;
      if (prev != null && curr != null && curr > prev) {
        elevationGainMeters += curr - prev;
      }
    }

    // HR samples → average HR
    const hrValues = points
      .map((p) => p.extensions?.TrackPointExtension?.hr)
      .filter((v): v is number => v != null);

    const averageHeartRate =
      hrValues.length > 0
        ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
        : undefined;

    const maxHeartRate = hrValues.length > 0 ? Math.max(...hrValues) : undefined;

    // Average speed
    const avgSpeedKmh =
      durationSeconds > 0 ? (distanceMeters / 1000) / (durationSeconds / 3600) : undefined;

    // Metric samples (downsampled)
    const metricSamples = extractGpxSamples(points, times, startTime);

    return {
      source: 'ManualGpxUpload',
      sport,
      startTime,
      ...(trk.name != null && trk.name.trim() !== '' && { title: trk.name.trim() }),
      durationSeconds,
      distanceMeters: distanceMeters > 0 ? Math.round(distanceMeters) : undefined,
      elevationGainMeters: elevationGainMeters > 0 ? Math.round(elevationGainMeters) : undefined,
      averageHeartRate,
      maxHeartRate,
      averageSpeedKmh: avgSpeedKmh,
      metricSamples: metricSamples.length > 0 ? metricSamples : undefined,
    };
  }
}

function extractGpxSamples(
  points: GpxTrkpt[],
  times: (Date | null)[],
  sessionStart: Date,
): ParsedMetricSample[] {
  const samples: ParsedMetricSample[] = [];
  let lastOffsetS = -SAMPLE_INTERVAL_S;

  for (let i = 0; i < points.length; i++) {
    const t = times[i];
    if (t == null) continue;

    const offsetS = Math.round((t.getTime() - sessionStart.getTime()) / 1000);
    if (offsetS < 0) continue;
    if (offsetS - lastOffsetS < SAMPLE_INTERVAL_S) continue;

    const p = points[i];
    const ext = p.extensions?.TrackPointExtension;

    samples.push({
      offsetSeconds: offsetS,
      heartRateBpm: ext?.hr,
      cadenceRpm: ext?.cad,
      elevationMeters: p.ele,
      latitude: p['@_lat'],
      longitude: p['@_lon'],
    });

    lastOffsetS = offsetS;
  }

  return samples;
}
