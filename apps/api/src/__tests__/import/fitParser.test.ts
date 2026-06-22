import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockParseAsync = vi.hoisted(() => vi.fn());

vi.mock('fit-file-parser', () => ({
  default: class MockFitParser {
    parseAsync = mockParseAsync;
  },
}));

const { FitParser } = await import('../../import/parsers/FitParser.js');

// Minimal valid FIT session shape (fit-file-parser list-mode output)
function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    start_time: '2026-06-22T07:00:00.000Z',
    sport: 'running',
    sub_sport: 'generic',
    total_timer_time: 3600,
    total_elapsed_time: 3602,
    total_distance: 10000,
    total_ascent: 80,
    avg_heart_rate: 148,
    max_heart_rate: 172,
    avg_power: undefined,
    normalized_power: undefined,
    avg_cadence: 168,
    avg_speed: 10,
    total_calories: 650,
    pool_length: undefined,
    ...overrides,
  };
}

function makeFitData(overrides: Record<string, unknown> = {}) {
  return {
    sessions: [makeSession()],
    laps: [],
    records: [],
    lengths: [],
    ...overrides,
  };
}

const VALID_BUFFER = Buffer.from([0x0e, 0x10]);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FitParser – input validation', () => {
  it('throws when input is not a Buffer', async () => {
    const parser = new FitParser();
    await expect(parser.parse('not a buffer')).rejects.toThrow('Buffer');
  });

  it('throws when no session is found in the FIT data', async () => {
    mockParseAsync.mockResolvedValueOnce({ sessions: [] });
    const parser = new FitParser();
    await expect(parser.parse(VALID_BUFFER)).rejects.toThrow('No session');
  });
});

describe('FitParser – sport mapping', () => {
  it('maps running sport', async () => {
    mockParseAsync.mockResolvedValueOnce(makeFitData());
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.sport).toBe('running');
  });

  it('maps cycling sport', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeFitData({ sessions: [makeSession({ sport: 'cycling' })] }),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.sport).toBe('cycling');
  });

  it('maps swimming sport', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeFitData({ sessions: [makeSession({ sport: 'swimming' })] }),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.sport).toBe('swimming');
  });

  it('maps fitness_equipment + strength_training to strength', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeFitData({
        sessions: [makeSession({ sport: 'fitness_equipment', sub_sport: 'strength_training' })],
      }),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.sport).toBe('strength');
  });

  it('maps unknown sport code to other', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeFitData({ sessions: [makeSession({ sport: 'golf' })] }),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.sport).toBe('other');
  });

  it('maps walking to other', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeFitData({ sessions: [makeSession({ sport: 'walking' })] }),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.sport).toBe('other');
  });
});

describe('FitParser – session-level metrics (running)', () => {
  it('extracts core session metrics', async () => {
    mockParseAsync.mockResolvedValueOnce(makeFitData());
    const result = await new FitParser().parse(VALID_BUFFER);

    expect(result.source).toBe('ManualFitUpload');
    expect(result.startTime).toEqual(new Date('2026-06-22T07:00:00.000Z'));
    expect(result.durationSeconds).toBe(3600);
    expect(result.distanceMeters).toBe(10000);
    expect(result.elevationGainMeters).toBe(80);
    expect(result.averageHeartRate).toBe(148);
    expect(result.maxHeartRate).toBe(172);
    expect(result.averageCadence).toBe(168);
    expect(result.averageSpeedKmh).toBe(10);
    expect(result.calories).toBe(650);
  });

  it('uses total_elapsed_time when total_timer_time is absent', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeFitData({
        sessions: [makeSession({ total_timer_time: undefined, total_elapsed_time: 1800 })],
      }),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.durationSeconds).toBe(1800);
  });

  it('does not include poolLengthMeters for running', async () => {
    mockParseAsync.mockResolvedValueOnce(makeFitData());
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.poolLengthMeters).toBeUndefined();
  });

  it('handles missing optional fields without crashing', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeFitData({
        sessions: [
          makeSession({
            avg_power: undefined,
            avg_cadence: undefined,
            total_ascent: undefined,
            max_heart_rate: undefined,
          }),
        ],
      }),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.averagePowerWatts).toBeUndefined();
    expect(result.averageCadence).toBeUndefined();
    expect(result.elevationGainMeters).toBeUndefined();
    expect(result.maxHeartRate).toBeUndefined();
  });

  it('extracts power metrics for cycling', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeFitData({
        sessions: [
          makeSession({
            sport: 'cycling',
            avg_power: 220,
            normalized_power: 235,
          }),
        ],
      }),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.averagePowerWatts).toBe(220);
    expect(result.normalizedPowerWatts).toBe(235);
  });
});

describe('FitParser – laps (non-swim)', () => {
  it('extracts lap metrics', async () => {
    const fitData = makeFitData({
      laps: [
        {
          total_timer_time: 600,
          total_distance: 1667,
          avg_heart_rate: 142,
          max_heart_rate: 155,
          avg_speed: 10,
          avg_power: undefined,
          avg_cadence: 170,
          total_ascent: 12,
        },
        {
          total_timer_time: 598,
          total_distance: 1663,
          avg_heart_rate: 152,
          max_heart_rate: 165,
          avg_speed: 10.02,
          avg_power: undefined,
          avg_cadence: 172,
          total_ascent: 8,
        },
      ],
    });
    mockParseAsync.mockResolvedValueOnce(fitData);
    const result = await new FitParser().parse(VALID_BUFFER);

    expect(result.laps).toHaveLength(2);
    expect(result.laps![0]).toMatchObject({
      lapNumber: 1,
      durationSeconds: 600,
      distanceMeters: 1667,
      averageHeartRateBpm: 142,
      maxHeartRateBpm: 155,
      averageCadence: 170,
      elevationGainMeters: 12,
    });
    expect(result.laps![0].averagePaceSecPerKm).toBeCloseTo(360, 0);
    expect(result.laps![1].lapNumber).toBe(2);
  });

  it('omits laps field when no laps in FIT file', async () => {
    mockParseAsync.mockResolvedValueOnce(makeFitData({ laps: [] }));
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.laps).toBeUndefined();
  });
});

describe('FitParser – swim lengths', () => {
  function makeSwimData(lengths: unknown[]) {
    return {
      sessions: [
        makeSession({
          sport: 'swimming',
          pool_length: 25,
          total_distance: lengths.filter((l) => (l as { length_type?: string }).length_type === 'active').length * 25,
        }),
      ],
      laps: [],
      records: [],
      lengths,
    };
  }

  it('extracts swim lengths as swimLaps', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeSwimData([
        { length_type: 'active', total_timer_time: 30, total_strokes: 20, swim_stroke: 'freestyle' },
        { length_type: 'active', total_timer_time: 32, total_strokes: 22, swim_stroke: 'backstroke' },
        { length_type: 'idle', total_timer_time: 15, total_strokes: 0, swim_stroke: undefined },
      ]),
    );
    const result = await new FitParser().parse(VALID_BUFFER);

    expect(result.swimLaps).toHaveLength(2);
    expect(result.swimLaps![0]).toMatchObject({
      lapNumber: 1,
      durationSeconds: 30,
      distanceMeters: 25,
      strokeType: 'Freestyle',
      strokeCount: 20,
    });
    expect(result.swimLaps![0].swolfScore).toBe(50); // 20 + 30
    expect(result.swimLaps![0].averagePaceSecPer100m).toBeCloseTo(120, 0);
    expect(result.swimLaps![1].strokeType).toBe('Backstroke');
  });

  it('filters out idle lengths', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeSwimData([
        { length_type: 'idle', total_timer_time: 15 },
        { length_type: 'active', total_timer_time: 30, total_strokes: 18, swim_stroke: 'freestyle' },
      ]),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.swimLaps).toHaveLength(1);
    expect(result.swimLaps![0].lapNumber).toBe(1);
  });

  it('sets dominant stroke type from lengths', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeSwimData([
        { length_type: 'active', total_timer_time: 30, swim_stroke: 'freestyle' },
        { length_type: 'active', total_timer_time: 30, swim_stroke: 'freestyle' },
        { length_type: 'active', total_timer_time: 35, swim_stroke: 'backstroke' },
      ]),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.dominantStrokeType).toBe('Freestyle');
  });

  it('includes poolLengthMeters for swim', async () => {
    mockParseAsync.mockResolvedValueOnce(makeSwimData([]));
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.poolLengthMeters).toBe(25);
  });

  it('does not include laps for swim', async () => {
    mockParseAsync.mockResolvedValueOnce(makeSwimData([]));
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.laps).toBeUndefined();
  });

  it('sums total stroke count from active lengths', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeSwimData([
        { length_type: 'active', total_timer_time: 30, total_strokes: 20, swim_stroke: 'freestyle' },
        { length_type: 'active', total_timer_time: 32, total_strokes: 22, swim_stroke: 'freestyle' },
      ]),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.totalStrokeCount).toBe(42);
  });
});

describe('FitParser – metric samples', () => {
  const START = '2026-06-22T07:00:00.000Z';

  function makeRecords(
    offsetsAndValues: Array<{ offsetS: number; hr?: number; power?: number; speed?: number }>,
  ) {
    return offsetsAndValues.map(({ offsetS, hr, power, speed }) => ({
      timestamp: new Date(new Date(START).getTime() + offsetS * 1000).toISOString(),
      heart_rate: hr,
      power,
      speed,
      cadence: undefined,
      altitude: undefined,
      position_lat: undefined,
      position_long: undefined,
    }));
  }

  it('downsamples records to ~1 per 5 seconds', async () => {
    const records = makeRecords([
      { offsetS: 0, hr: 130 },
      { offsetS: 1, hr: 131 },
      { offsetS: 2, hr: 132 },
      { offsetS: 3, hr: 133 },
      { offsetS: 4, hr: 134 },
      { offsetS: 5, hr: 135 },
      { offsetS: 6, hr: 136 },
      { offsetS: 10, hr: 140 },
    ]);
    mockParseAsync.mockResolvedValueOnce(
      makeFitData({ sessions: [makeSession({ start_time: START })], records }),
    );
    const result = await new FitParser().parse(VALID_BUFFER);

    // should keep offsetS=0, 5, 10 (every 5s+)
    expect(result.metricSamples).toHaveLength(3);
    expect(result.metricSamples![0].offsetSeconds).toBe(0);
    expect(result.metricSamples![0].heartRateBpm).toBe(130);
    expect(result.metricSamples![1].offsetSeconds).toBe(5);
    expect(result.metricSamples![2].offsetSeconds).toBe(10);
  });

  it('computes pace from speed', async () => {
    const records = makeRecords([{ offsetS: 0, speed: 10 }]); // 10 km/h
    mockParseAsync.mockResolvedValueOnce(
      makeFitData({ sessions: [makeSession({ start_time: START })], records }),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    // 3600 / 10 = 360 sec/km
    expect(result.metricSamples![0].paceSecPerKm).toBeCloseTo(360, 0);
  });

  it('returns undefined metricSamples when no records', async () => {
    mockParseAsync.mockResolvedValueOnce(makeFitData({ records: [] }));
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.metricSamples).toBeUndefined();
  });

  it('skips records with invalid timestamps', async () => {
    mockParseAsync.mockResolvedValueOnce(
      makeFitData({
        sessions: [makeSession({ start_time: START })],
        records: [
          { timestamp: 'invalid', heart_rate: 120 },
          { timestamp: new Date(new Date(START).getTime() + 10000).toISOString(), heart_rate: 145 },
        ],
      }),
    );
    const result = await new FitParser().parse(VALID_BUFFER);
    expect(result.metricSamples).toHaveLength(1);
    expect(result.metricSamples![0].heartRateBpm).toBe(145);
  });
});
