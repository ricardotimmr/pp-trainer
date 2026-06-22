import { describe, expect, it } from 'vitest';

import { TcxParser } from '../../import/parsers/TcxParser.js';

const parser = new TcxParser();

function makeTp(opts: {
  time: string;
  hr?: number;
  cadence?: number;
  watts?: number;
}): string {
  const hr = opts.hr != null ? `<HeartRateBpm><Value>${opts.hr}</Value></HeartRateBpm>` : '';
  const cad = opts.cadence != null ? `<Cadence>${opts.cadence}</Cadence>` : '';
  const ext =
    opts.watts != null
      ? `<Extensions><ns3:TPX><ns3:Watts>${opts.watts}</ns3:Watts></ns3:TPX></Extensions>`
      : '';
  return `<Trackpoint><Time>${opts.time}</Time>${hr}${cad}${ext}</Trackpoint>`;
}

function makeLap(opts: {
  startTime: string;
  totalTime: number;
  distance: number;
  avgHr?: number;
  maxHr?: number;
  calories?: number;
  avgCadence?: number;
  trackpoints?: string;
}): string {
  const avgHr =
    opts.avgHr != null
      ? `<AverageHeartRateBpm><Value>${opts.avgHr}</Value></AverageHeartRateBpm>`
      : '';
  const maxHr =
    opts.maxHr != null
      ? `<MaximumHeartRateBpm><Value>${opts.maxHr}</Value></MaximumHeartRateBpm>`
      : '';
  const calories = opts.calories != null ? `<Calories>${opts.calories}</Calories>` : '';
  const cad = opts.avgCadence != null ? `<AverageCadence>${opts.avgCadence}</AverageCadence>` : '';
  const track =
    opts.trackpoints != null ? `<Track>${opts.trackpoints}</Track>` : '';
  return `<Lap StartTime="${opts.startTime}">
    <TotalTimeSeconds>${opts.totalTime}</TotalTimeSeconds>
    <DistanceMeters>${opts.distance}</DistanceMeters>
    ${avgHr}${maxHr}${calories}${cad}${track}
  </Lap>`;
}

function makeTcx(laps: string, sport = 'Running'): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
  <Activities>
    <Activity Sport="${sport}">
      ${laps}
    </Activity>
  </Activities>
</TrainingCenterDatabase>`);
}

const BASE_LAP = makeLap({
  startTime: '2026-06-22T07:00:00Z',
  totalTime: 3600,
  distance: 10000,
  avgHr: 148,
  maxHr: 172,
  calories: 650,
  avgCadence: 168,
  trackpoints:
    makeTp({ time: '2026-06-22T07:00:00Z', hr: 140 }) +
    makeTp({ time: '2026-06-22T07:00:05Z', hr: 145 }) +
    makeTp({ time: '2026-06-22T07:00:10Z', hr: 150 }),
});

describe('TcxParser – input validation', () => {
  it('throws when input is not a Buffer', async () => {
    await expect(parser.parse('string')).rejects.toThrow('Buffer');
  });

  it('throws when no Activity element found', async () => {
    const buf = Buffer.from(`<?xml version="1.0"?><TrainingCenterDatabase><Activities></Activities></TrainingCenterDatabase>`);
    await expect(parser.parse(buf)).rejects.toThrow('Activity');
  });

  it('throws when Activity has no Lap elements', async () => {
    const buf = makeTcx('');
    await expect(parser.parse(buf)).rejects.toThrow('Lap');
  });
});

describe('TcxParser – sport mapping', () => {
  it('maps Running to running', async () => {
    const result = await parser.parse(makeTcx(BASE_LAP, 'Running'));
    expect(result.sport).toBe('running');
  });

  it('maps Biking to cycling', async () => {
    const lap = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 1800, distance: 15000 });
    const result = await parser.parse(makeTcx(lap, 'Biking'));
    expect(result.sport).toBe('cycling');
  });

  it('maps Other to other', async () => {
    const lap = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 900, distance: 0 });
    const result = await parser.parse(makeTcx(lap, 'Other'));
    expect(result.sport).toBe('other');
  });

  it('maps Swimming to swimming', async () => {
    const lap = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 1800, distance: 2000 });
    const result = await parser.parse(makeTcx(lap, 'Swimming'));
    expect(result.sport).toBe('swimming');
  });

  it('maps unknown sport to other', async () => {
    const lap = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 600, distance: 0 });
    const result = await parser.parse(makeTcx(lap, 'Yoga'));
    expect(result.sport).toBe('other');
  });
});

describe('TcxParser – session-level metrics', () => {
  it('extracts source and startTime', async () => {
    const result = await parser.parse(makeTcx(BASE_LAP));
    expect(result.source).toBe('ManualTcxUpload');
    expect(result.startTime).toEqual(new Date('2026-06-22T07:00:00Z'));
  });

  it('sums total duration from laps', async () => {
    const result = await parser.parse(makeTcx(BASE_LAP));
    expect(result.durationSeconds).toBe(3600);
  });

  it('sums total distance from laps', async () => {
    const result = await parser.parse(makeTcx(BASE_LAP));
    expect(result.distanceMeters).toBe(10000);
  });

  it('extracts calories', async () => {
    const result = await parser.parse(makeTcx(BASE_LAP));
    expect(result.calories).toBe(650);
  });

  it('computes average speed from distance and duration', async () => {
    const result = await parser.parse(makeTcx(BASE_LAP));
    // 10 km / 1 h = 10 km/h
    expect(result.averageSpeedKmh).toBeCloseTo(10, 1);
  });

  it('computes weighted average HR across laps', async () => {
    const lap1 = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 600, distance: 1000, avgHr: 140 });
    const lap2 = makeLap({ startTime: '2026-06-22T07:10:00Z', totalTime: 600, distance: 1000, avgHr: 160 });
    const result = await parser.parse(makeTcx(lap1 + lap2));
    // equal duration → simple average = 150
    expect(result.averageHeartRate).toBe(150);
  });

  it('computes max HR as max across laps', async () => {
    const lap1 = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 600, distance: 1000, maxHr: 165 });
    const lap2 = makeLap({ startTime: '2026-06-22T07:10:00Z', totalTime: 600, distance: 1000, maxHr: 175 });
    const result = await parser.parse(makeTcx(lap1 + lap2));
    expect(result.maxHeartRate).toBe(175);
  });

  it('sets HR fields undefined when not present', async () => {
    const lap = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 1800, distance: 5000 });
    const result = await parser.parse(makeTcx(lap));
    expect(result.averageHeartRate).toBeUndefined();
    expect(result.maxHeartRate).toBeUndefined();
  });
});

describe('TcxParser – lap extraction', () => {
  it('produces a laps array with correct count', async () => {
    const lap1 = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 300, distance: 1000, avgHr: 140, maxHr: 155 });
    const lap2 = makeLap({ startTime: '2026-06-22T07:05:00Z', totalTime: 300, distance: 1010, avgHr: 150, maxHr: 165 });
    const result = await parser.parse(makeTcx(lap1 + lap2));
    expect(result.laps).toHaveLength(2);
  });

  it('lap has correct metrics', async () => {
    const lap = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 600, distance: 2000, avgHr: 145, maxHr: 162 });
    const result = await parser.parse(makeTcx(lap));
    expect(result.laps![0]).toMatchObject({
      lapNumber: 1,
      durationSeconds: 600,
      distanceMeters: 2000,
      averageHeartRateBpm: 145,
      maxHeartRateBpm: 162,
    });
  });

  it('computes pace for each lap', async () => {
    // 2 km in 10 min → 5 min/km = 300 sec/km → 10 km/h
    const lap = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 600, distance: 2000 });
    const result = await parser.parse(makeTcx(lap));
    expect(result.laps![0].averagePaceSecPerKm).toBeCloseTo(300, 0);
  });
});

describe('TcxParser – power extraction', () => {
  it('extracts average power from trackpoint extensions', async () => {
    const lap = makeLap({
      startTime: '2026-06-22T07:00:00Z',
      totalTime: 1800,
      distance: 15000,
      trackpoints:
        makeTp({ time: '2026-06-22T07:00:00Z', watts: 200 }) +
        makeTp({ time: '2026-06-22T07:00:05Z', watts: 220 }) +
        makeTp({ time: '2026-06-22T07:00:10Z', watts: 240 }),
    });
    const result = await parser.parse(makeTcx(lap, 'Biking'));
    expect(result.averagePowerWatts).toBe(220);
  });

  it('sets averagePowerWatts undefined when no power data', async () => {
    const result = await parser.parse(makeTcx(BASE_LAP));
    expect(result.averagePowerWatts).toBeUndefined();
  });
});

describe('TcxParser – metric samples', () => {
  it('extracts metric samples from trackpoints', async () => {
    const result = await parser.parse(makeTcx(BASE_LAP));
    expect(result.metricSamples).toBeDefined();
    expect(result.metricSamples!.length).toBeGreaterThan(0);
  });

  it('downsamples to ~1 per 5 seconds', async () => {
    // 3 trackpoints at 0s, 5s, 10s → 3 samples
    const result = await parser.parse(makeTcx(BASE_LAP));
    const offsets = result.metricSamples!.map((s) => s.offsetSeconds);
    expect(offsets).toContain(0);
    expect(offsets).toContain(5);
    expect(offsets).toContain(10);
  });

  it('includes HR in metric samples', async () => {
    const result = await parser.parse(makeTcx(BASE_LAP));
    expect(result.metricSamples![0].heartRateBpm).toBe(140);
  });

  it('includes power in metric samples when present', async () => {
    const lap = makeLap({
      startTime: '2026-06-22T07:00:00Z',
      totalTime: 600,
      distance: 5000,
      trackpoints: makeTp({ time: '2026-06-22T07:00:00Z', watts: 230 }),
    });
    const result = await parser.parse(makeTcx(lap, 'Biking'));
    expect(result.metricSamples![0].powerWatts).toBe(230);
  });

  it('returns undefined metricSamples when no trackpoints', async () => {
    const lap = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 1800, distance: 5000 });
    const result = await parser.parse(makeTcx(lap));
    expect(result.metricSamples).toBeUndefined();
  });
});

describe('TcxParser – multi-lap activity', () => {
  it('aggregates distance and duration across laps', async () => {
    const lap1 = makeLap({ startTime: '2026-06-22T07:00:00Z', totalTime: 600, distance: 2000 });
    const lap2 = makeLap({ startTime: '2026-06-22T07:10:00Z', totalTime: 600, distance: 2100 });
    const lap3 = makeLap({ startTime: '2026-06-22T07:20:00Z', totalTime: 600, distance: 1900 });
    const result = await parser.parse(makeTcx(lap1 + lap2 + lap3));

    expect(result.durationSeconds).toBe(1800);
    expect(result.distanceMeters).toBe(6000);
    expect(result.laps).toHaveLength(3);
    expect(result.laps![1].lapNumber).toBe(2);
    expect(result.laps![2].lapNumber).toBe(3);
  });
});
