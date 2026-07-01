import Fastify from 'fastify';
import type { AthleteProfile, DailyHealthSummary, HrvStatus, SleepSession } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupErrorHandling } from '../../errors/errorHandler.js';
import { healthRoutes } from '../../routes/healthRoutes.js';

vi.mock('../../lib/prisma.js', () => ({ prisma: {}, disconnectPrisma: vi.fn() }));
vi.mock('../../repositories/AthleteRepository.js');
vi.mock('../../repositories/DailyHealthRepository.js');
vi.mock('../../repositories/SleepSessionRepository.js');
vi.mock('../../repositories/HrvStatusRepository.js');

const AthleteRepository = await import('../../repositories/AthleteRepository.js');
const DailyHealthRepository = await import('../../repositories/DailyHealthRepository.js');
const SleepSessionRepository = await import('../../repositories/SleepSessionRepository.js');
const HrvStatusRepository = await import('../../repositories/HrvStatusRepository.js');

const PROFILE_ID = 'profile-health';

function buildApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(healthRoutes);
  return app;
}

function makeProfile(): AthleteProfile {
  return { id: PROFILE_ID } as AthleteProfile;
}

describe('healthRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(makeProfile());
    vi.mocked(DailyHealthRepository.findDailyHealth).mockResolvedValue([]);
    vi.mocked(SleepSessionRepository.findSleepSessions).mockResolvedValue([]);
    vi.mocked(HrvStatusRepository.findHrvStatuses).mockResolvedValue([]);
  });

  it('returns daily health data with optional null fields omitted', async () => {
    vi.mocked(DailyHealthRepository.findDailyHealth).mockResolvedValue([
      {
        id: 'daily-1',
        date: new Date('2026-06-30T00:00:00.000Z'),
        source: 'GarminUnofficial',
        athleteProfileId: PROFILE_ID,
        restingHeartRate: 48,
        steps: 9800,
        floors: null,
        activeCalories: null,
        totalCalories: null,
        avgStressLevel: 31,
        bodyBatteryLow: 24,
        bodyBatteryHigh: 82,
        avgRespiration: null,
        avgSpo2: null,
      } as DailyHealthSummary,
    ]);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/health/daily?from=2026-06-30&to=2026-07-01',
    });

    expect(res.statusCode).toBe(200);
    expect(DailyHealthRepository.findDailyHealth).toHaveBeenCalledWith(
      PROFILE_ID,
      new Date('2026-06-30T00:00:00.000Z'),
      new Date('2026-07-01T00:00:00.000Z'),
    );
    expect(res.json()).toEqual({
      days: [
        {
          id: 'daily-1',
          date: '2026-06-30T00:00:00.000Z',
          source: 'garmin_unofficial',
          restingHeartRate: 48,
          steps: 9800,
          avgStressLevel: 31,
          bodyBatteryLow: 24,
          bodyBatteryHigh: 82,
        },
      ],
    });
  });

  it('returns sleep stages, score and omits null avgSpo2', async () => {
    vi.mocked(SleepSessionRepository.findSleepSessions).mockResolvedValue([
      {
        id: 'sleep-1',
        date: new Date('2026-06-30T00:00:00.000Z'),
        source: 'GarminUnofficial',
        athleteProfileId: PROFILE_ID,
        startTime: new Date('2026-06-29T22:15:00.000Z'),
        endTime: new Date('2026-06-30T06:20:00.000Z'),
        totalSleepSeconds: 29100,
        deepSleepSeconds: 5400,
        lightSleepSeconds: 16800,
        remSleepSeconds: 5100,
        awakeSeconds: 1800,
        sleepScore: 82,
        avgStress: null,
        avgSpo2: null,
      } as SleepSession,
    ]);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/health/sleep?from=2026-06-30&to=2026-06-30',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      sessions: [
        {
          id: 'sleep-1',
          date: '2026-06-30T00:00:00.000Z',
          source: 'garmin_unofficial',
          startTime: '2026-06-29T22:15:00.000Z',
          endTime: '2026-06-30T06:20:00.000Z',
          totalSleepSeconds: 29100,
          deepSleepSeconds: 5400,
          lightSleepSeconds: 16800,
          remSleepSeconds: 5100,
          awakeSeconds: 1800,
          sleepScore: 82,
        },
      ],
    });
  });

  it('returns HRV weekly average and five-minute high as primary fields', async () => {
    vi.mocked(HrvStatusRepository.findHrvStatuses).mockResolvedValue([
      {
        id: 'hrv-1',
        date: new Date('2026-06-30T00:00:00.000Z'),
        source: 'GarminUnofficial',
        athleteProfileId: PROFILE_ID,
        weeklyAvgHrv: 57,
        lastNightAvgHrv: null,
        lastNightFiveMinHigh: 84,
        status: 'balanced',
      } as HrvStatus,
    ]);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/health/hrv?from=2026-06-30&to=2026-06-30',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      statuses: [
        {
          id: 'hrv-1',
          date: '2026-06-30T00:00:00.000Z',
          source: 'garmin_unofficial',
          weeklyAvgHrv: 57,
          lastNightFiveMinHigh: 84,
          status: 'balanced',
        },
      ],
    });
  });

  it('returns empty arrays when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/health/daily?from=2026-06-30&to=2026-06-30',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ days: [] });
  });

  it('rejects invalid or reversed date ranges', async () => {
    const app = buildApp();

    const invalid = await app.inject({
      method: 'GET',
      url: '/api/health/daily?from=bad&to=2026-06-30',
    });
    const reversed = await app.inject({
      method: 'GET',
      url: '/api/health/daily?from=2026-07-01&to=2026-06-30',
    });

    expect(invalid.statusCode).toBe(400);
    expect(reversed.statusCode).toBe(400);
  });
});
