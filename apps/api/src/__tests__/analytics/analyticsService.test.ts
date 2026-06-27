import type { SportType } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../errors/ApiError.js';
import * as ActivityRepository from '../../repositories/ActivityRepository.js';
import * as AthleteRepository from '../../repositories/AthleteRepository.js';
import * as AnalyticsService from '../../services/AnalyticsService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../repositories/ActivityRepository.js');
vi.mock('../../repositories/AthleteRepository.js');

afterEach(() => {
  vi.useRealTimers();
});

function analyticsActivity(
  sport: SportType,
  startTime: string,
  durationSeconds: number,
) {
  return {
    sport,
    startTime: new Date(startTime),
    durationSeconds,
  };
}

describe('AnalyticsService.getWeeklySummaries', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T12:00:00.000Z'));
  });

  it('groups activities by ISO week and sport', async () => {
    vi.mocked(ActivityRepository.findActivitiesForAnalytics).mockResolvedValue([
      analyticsActivity('Running', '2024-05-06T07:00:00.000Z', 3600),
      analyticsActivity('Cycling', '2024-05-08T17:00:00.000Z', 5400),
      analyticsActivity('Running', '2024-05-13T06:30:00.000Z', 1800),
    ]);

    const result = await AnalyticsService.getWeeklySummaries('athlete-1', 2);

    expect(ActivityRepository.findActivitiesForAnalytics).toHaveBeenCalledWith(
      'athlete-1',
      new Date('2024-05-06T00:00:00.000Z'),
      new Date('2024-05-19T23:59:59.999Z'),
    );
    expect(result).toEqual([
      {
        weekStart: '2024-05-06',
        totalSeconds: 9000,
        bySport: [
          { sport: 'running', seconds: 3600 },
          { sport: 'cycling', seconds: 5400 },
        ],
      },
      {
        weekStart: '2024-05-13',
        totalSeconds: 1800,
        bySport: [{ sport: 'running', seconds: 1800 }],
      },
    ]);
  });

  it('includes empty weeks when the selected range contains activity data', async () => {
    vi.mocked(ActivityRepository.findActivitiesForAnalytics).mockResolvedValue([
      analyticsActivity('Swimming', '2024-05-13T06:00:00.000Z', 2400),
    ]);

    const result = await AnalyticsService.getWeeklySummaries('athlete-1', 2);

    expect(result).toEqual([
      { weekStart: '2024-05-06', totalSeconds: 0, bySport: [] },
      {
        weekStart: '2024-05-13',
        totalSeconds: 2400,
        bySport: [{ sport: 'swimming', seconds: 2400 }],
      },
    ]);
  });

  it('returns an empty array when no activities exist in the range', async () => {
    vi.mocked(ActivityRepository.findActivitiesForAnalytics).mockResolvedValue([]);

    await expect(AnalyticsService.getWeeklySummaries('athlete-1', 8)).resolves.toEqual([]);
  });

  it('rejects invalid week counts', async () => {
    await expect(AnalyticsService.getWeeklySummaries('athlete-1', 0)).rejects.toThrow(
      ApiError,
    );
    await expect(AnalyticsService.getWeeklySummaries('athlete-1', 27)).rejects.toThrow(
      'weeks must be an integer between 1 and 26',
    );
  });
});

describe('AnalyticsService.getCurrentAthleteWeeklySummaries', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T12:00:00.000Z'));
  });

  it('returns empty results when no athlete exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);

    await expect(AnalyticsService.getCurrentAthleteWeeklySummaries(8)).resolves.toEqual([]);
    expect(ActivityRepository.findActivitiesForAnalytics).not.toHaveBeenCalled();
  });
});

describe('AnalyticsService.getSportDistribution', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('groups activity count and duration by sport', async () => {
    vi.mocked(ActivityRepository.findActivitiesForAnalytics).mockResolvedValue([
      analyticsActivity('Running', '2024-05-01T07:00:00.000Z', 3600),
      analyticsActivity('Running', '2024-05-02T07:00:00.000Z', 1800),
      analyticsActivity('Cycling', '2024-05-03T17:00:00.000Z', 7200),
    ]);

    const result = await AnalyticsService.getSportDistribution(
      'athlete-1',
      '2024-05-01',
      '2024-05-31',
    );

    expect(ActivityRepository.findActivitiesForAnalytics).toHaveBeenCalledWith(
      'athlete-1',
      new Date('2024-05-01T00:00:00.000Z'),
      new Date('2024-05-31T23:59:59.999Z'),
    );
    expect(result).toEqual([
      { sport: 'running', activityCount: 2, totalSeconds: 5400 },
      { sport: 'cycling', activityCount: 1, totalSeconds: 7200 },
    ]);
  });

  it('returns an empty array when no activities exist', async () => {
    vi.mocked(ActivityRepository.findActivitiesForAnalytics).mockResolvedValue([]);

    await expect(
      AnalyticsService.getSportDistribution('athlete-1', '2024-05-01', '2024-05-31'),
    ).resolves.toEqual([]);
  });

  it('rejects invalid date params', async () => {
    await expect(
      AnalyticsService.getSportDistribution('athlete-1', '2024-02-31', '2024-05-31'),
    ).rejects.toThrow('from must be a valid YYYY-MM-DD date');
    await expect(
      AnalyticsService.getSportDistribution('athlete-1', '2024-06-01', '2024-05-31'),
    ).rejects.toThrow('from must be before or equal to to');
  });
});
