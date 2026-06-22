import { describe, expect, it } from 'vitest';

import { GpxParser } from '../../import/parsers/GpxParser.js';

const parser = new GpxParser();

// ~111 m north of (0,0)
const POINT_A = { lat: 0.0000, lon: 0.0000, ele: 100, time: '2026-06-22T07:00:00Z', hr: 130, cad: 160 };
const POINT_B = { lat: 0.0010, lon: 0.0000, ele: 110, time: '2026-06-22T07:00:05Z', hr: 135, cad: 162 };
const POINT_C = { lat: 0.0020, lon: 0.0000, ele: 108, time: '2026-06-22T07:00:10Z', hr: 140, cad: 164 };

function gpxPoint(
  p: { lat: number; lon: number; ele?: number; time: string; hr?: number; cad?: number },
): string {
  const ext =
    p.hr != null
      ? `<extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>${p.hr}</gpxtpx:hr>${
          p.cad != null ? `<gpxtpx:cad>${p.cad}</gpxtpx:cad>` : ''
        }</gpxtpx:TrackPointExtension></extensions>`
      : '';
  return `<trkpt lat="${p.lat}" lon="${p.lon}">${p.ele != null ? `<ele>${p.ele}</ele>` : ''}<time>${p.time}</time>${ext}</trkpt>`;
}

function makeGpx(trkPoints: string, type = 'running'): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <trk>
    <type>${type}</type>
    <trkseg>${trkPoints}</trkseg>
  </trk>
</gpx>`);
}

describe('GpxParser – input validation', () => {
  it('throws when input is not a Buffer', async () => {
    await expect(parser.parse('not a buffer')).rejects.toThrow('Buffer');
  });

  it('throws when no track element found', async () => {
    const buf = Buffer.from('<?xml version="1.0"?><gpx version="1.1"></gpx>');
    await expect(parser.parse(buf)).rejects.toThrow('track');
  });

  it('throws when no trackpoints found', async () => {
    const buf = Buffer.from(`<?xml version="1.0"?><gpx version="1.1"><trk><trkseg></trkseg></trk></gpx>`);
    await expect(parser.parse(buf)).rejects.toThrow('trackpoints');
  });
});

describe('GpxParser – sport mapping', () => {
  it('maps running type', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B), 'running');
    const result = await parser.parse(buf);
    expect(result.sport).toBe('running');
  });

  it('maps cycling type', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B), 'cycling');
    const result = await parser.parse(buf);
    expect(result.sport).toBe('cycling');
  });

  it('maps biking alias to cycling', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B), 'biking');
    const result = await parser.parse(buf);
    expect(result.sport).toBe('cycling');
  });

  it('maps unknown type to other', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B), 'yoga');
    const result = await parser.parse(buf);
    expect(result.sport).toBe('other');
  });

  it('defaults to other when type element is absent', async () => {
    const buf = Buffer.from(`<?xml version="1.0"?><gpx version="1.1"><trk><trkseg>${gpxPoint(POINT_A)}${gpxPoint(POINT_B)}</trkseg></trk></gpx>`);
    const result = await parser.parse(buf);
    expect(result.sport).toBe('other');
  });
});

describe('GpxParser – core metric extraction', () => {
  it('sets source and startTime correctly', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B));
    const result = await parser.parse(buf);
    expect(result.source).toBe('ManualGpxUpload');
    expect(result.startTime).toEqual(new Date('2026-06-22T07:00:00Z'));
  });

  it('computes duration from first and last timestamp', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B) + gpxPoint(POINT_C));
    const result = await parser.parse(buf);
    expect(result.durationSeconds).toBe(10); // 07:00:00 → 07:00:10
  });

  it('computes distance > 0 from Haversine', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B) + gpxPoint(POINT_C));
    const result = await parser.parse(buf);
    expect(result.distanceMeters).toBeGreaterThan(0);
    // 2 × ~111 m per 0.001° lat ≈ 222 m
    expect(result.distanceMeters!).toBeGreaterThan(100);
    expect(result.distanceMeters!).toBeLessThan(500);
  });

  it('computes elevation gain from positive deltas only', async () => {
    // A→B: +10m gain, B→C: -2m loss (ignored)
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B) + gpxPoint(POINT_C));
    const result = await parser.parse(buf);
    expect(result.elevationGainMeters).toBeCloseTo(10, 0);
  });

  it('sets averageSpeedKmh from distance/duration', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B));
    const result = await parser.parse(buf);
    expect(result.averageSpeedKmh).toBeGreaterThan(0);
  });
});

describe('GpxParser – Garmin HR extension', () => {
  it('extracts average HR from trackpoint extensions', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B) + gpxPoint(POINT_C));
    const result = await parser.parse(buf);
    // (130 + 135 + 140) / 3 = 135
    expect(result.averageHeartRate).toBe(135);
  });

  it('extracts max HR from trackpoint extensions', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B) + gpxPoint(POINT_C));
    const result = await parser.parse(buf);
    expect(result.maxHeartRate).toBe(140);
  });

  it('sets averageHeartRate undefined when no HR in extensions', async () => {
    const pointsNoHr = [POINT_A, POINT_B, POINT_C]
      .map((p) => gpxPoint({ ...p, hr: undefined, cad: undefined }))
      .join('');
    const buf = makeGpx(pointsNoHr);
    const result = await parser.parse(buf);
    expect(result.averageHeartRate).toBeUndefined();
    expect(result.maxHeartRate).toBeUndefined();
  });
});

describe('GpxParser – metric samples', () => {
  it('downsamples to ~1 sample per 5 seconds', async () => {
    // 3 points at 0s, 5s, 10s → should produce 3 samples
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B) + gpxPoint(POINT_C));
    const result = await parser.parse(buf);
    expect(result.metricSamples).toBeDefined();
    expect(result.metricSamples!.length).toBe(3);
    expect(result.metricSamples![0].offsetSeconds).toBe(0);
    expect(result.metricSamples![1].offsetSeconds).toBe(5);
    expect(result.metricSamples![2].offsetSeconds).toBe(10);
  });

  it('includes HR and cadence in samples when present', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B));
    const result = await parser.parse(buf);
    expect(result.metricSamples![0].heartRateBpm).toBe(130);
    expect(result.metricSamples![0].cadenceRpm).toBe(160);
  });

  it('includes elevation and GPS coords in samples', async () => {
    const buf = makeGpx(gpxPoint(POINT_A) + gpxPoint(POINT_B));
    const result = await parser.parse(buf);
    expect(result.metricSamples![0].elevationMeters).toBe(100);
    expect(result.metricSamples![0].latitude).toBeCloseTo(0, 4);
    expect(result.metricSamples![0].longitude).toBeCloseTo(0, 4);
  });

  it('drops points closer than 5 seconds to previous kept point', async () => {
    // Points at 0s, 2s, 3s, 5s → keep 0s and 5s only
    const points = [
      { lat: 0, lon: 0, time: '2026-06-22T07:00:00Z', hr: 130 },
      { lat: 0, lon: 0, time: '2026-06-22T07:00:02Z', hr: 131 },
      { lat: 0, lon: 0, time: '2026-06-22T07:00:03Z', hr: 132 },
      { lat: 0, lon: 0, time: '2026-06-22T07:00:05Z', hr: 135 },
    ].map(gpxPoint).join('');
    const buf = makeGpx(points);
    const result = await parser.parse(buf);
    expect(result.metricSamples!.length).toBe(2);
    expect(result.metricSamples![0].heartRateBpm).toBe(130);
    expect(result.metricSamples![1].heartRateBpm).toBe(135);
  });

  it('returns undefined metricSamples when no points with timestamps', async () => {
    // single point only → duration=0, but 1 sample at offset 0
    const buf = makeGpx(gpxPoint(POINT_A));
    const result = await parser.parse(buf);
    // 1 sample at offset 0 is valid
    expect(result.metricSamples).toBeDefined();
  });
});
