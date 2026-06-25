import type { AthleteProfile, TrainingGoal } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as ActivityRepository from '../../repositories/ActivityRepository.js';
import * as AthleteRepository from '../../repositories/AthleteRepository.js';
import * as ContextRepository from '../../repositories/ContextRepository.js';
import * as PerformanceRepository from '../../repositories/PerformanceRepository.js';
import * as TrainingRepository from '../../repositories/TrainingRepository.js';
import { buildAthleteContext, saveContextSnapshot } from '../../services/AthleteContextService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../repositories/AthleteRepository.js');
vi.mock('../../repositories/ActivityRepository.js');
vi.mock('../../repositories/PerformanceRepository.js');
vi.mock('../../repositories/TrainingRepository.js');
vi.mock('../../repositories/ContextRepository.js');

const baseProfile: AthleteProfile = {
  id: 'profile-1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  displayName: 'Test Athlete',
  birthYear: 1990,
  bodyWeightKg: new Prisma.Decimal('72.5'),
  heightCm: 178,
  primarySports: ['Running', 'Cycling'],
  currentFtpWatts: 280,
  maxHeartRateBpm: 185,
  restingHeartRateBpm: 48,
  runningThresholdHrBpm: null,
  runningThresholdPaceSecPerKm: 270,
  swimmingThresholdPaceSecPer100m: null,
  notes: null,
};

const makeGoal = (id: string, title: string, priority: 'MainGoal' | 'SecondaryGoal' | 'Watchlist'): TrainingGoal => ({
  id,
  createdAt: new Date(),
  updatedAt: new Date(),
  athleteProfileId: 'profile-1',
  title,
  goalType: 'Race',
  targetDate: null,
  sport: 'Running',
  priority,
  targetDistanceMeters: null,
  targetDurationSeconds: null,
  targetPaceSecPerKm: null,
  targetPowerWatts: null,
  targetSwimPaceSecPer100m: null,
  description: null,
  isActive: true,
});

function setupEmptyRepos() {
  vi.mocked(AthleteRepository.findAthleteGoals).mockResolvedValue([]);
  vi.mocked(AthleteRepository.findAthleteAvailability).mockResolvedValue([]);
  vi.mocked(AthleteRepository.findAthleteZoneSets).mockResolvedValue([]);
  vi.mocked(ActivityRepository.findActivities).mockResolvedValue([]);
  vi.mocked(PerformanceRepository.findPerformanceMetrics).mockResolvedValue([]);
  vi.mocked(PerformanceRepository.findRacePredictions).mockResolvedValue([]);
  vi.mocked(TrainingRepository.findActivePlanWithWeekWorkouts).mockResolvedValue(null);
}

describe('buildAthleteContext', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns null when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    const result = await buildAthleteContext();
    expect(result).toBeNull();
  });

  it('returns context with version and generatedAt', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(baseProfile);
    setupEmptyRepos();
    const ctx = await buildAthleteContext();
    expect(ctx?.version).toBe('v1');
    expect(ctx?.generatedAt).toBeDefined();
    expect(typeof ctx?.generatedAt).toBe('string');
  });

  it('includes mapped athlete profile', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(baseProfile);
    setupEmptyRepos();
    const ctx = await buildAthleteContext();
    expect(ctx?.athleteProfile.id).toBe('profile-1');
    expect(ctx?.athleteProfile.displayName).toBe('Test Athlete');
    expect(ctx?.athleteProfile.primarySports).toEqual(['running', 'cycling']);
  });

  it('places main_goal correctly and leaves secondaryGoals and watchlistGoals empty', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(baseProfile);
    setupEmptyRepos();
    vi.mocked(AthleteRepository.findAthleteGoals).mockResolvedValue([
      makeGoal('g1', 'Win Berlin Marathon', 'MainGoal'),
    ]);
    const ctx = await buildAthleteContext();
    expect(ctx?.goals.mainGoal?.id).toBe('g1');
    expect(ctx?.goals.mainGoal?.priority).toBe('main_goal');
    expect(ctx?.goals.secondaryGoals).toHaveLength(0);
    expect(ctx?.goals.watchlistGoals).toHaveLength(0);
  });

  it('places secondary and watchlist goals in correct buckets', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(baseProfile);
    setupEmptyRepos();
    vi.mocked(AthleteRepository.findAthleteGoals).mockResolvedValue([
      makeGoal('g1', 'A Race', 'MainGoal'),
      makeGoal('g2', 'B Race', 'SecondaryGoal'),
      makeGoal('g3', 'C Race', 'SecondaryGoal'),
      makeGoal('g4', 'Monitor HR', 'Watchlist'),
    ]);
    const ctx = await buildAthleteContext();
    expect(ctx?.goals.mainGoal?.id).toBe('g1');
    expect(ctx?.goals.secondaryGoals).toHaveLength(2);
    expect(ctx?.goals.secondaryGoals[0].priority).toBe('secondary_goal');
    expect(ctx?.goals.watchlistGoals).toHaveLength(1);
    expect(ctx?.goals.watchlistGoals[0].priority).toBe('watchlist');
  });

  it('sets mainGoal to null when no main goal exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(baseProfile);
    setupEmptyRepos();
    vi.mocked(AthleteRepository.findAthleteGoals).mockResolvedValue([
      makeGoal('g1', 'Some Goal', 'Watchlist'),
    ]);
    const ctx = await buildAthleteContext();
    expect(ctx?.goals.mainGoal).toBeNull();
    expect(ctx?.goals.watchlistGoals).toHaveLength(1);
  });

  it('sets currentWeek.trainingPlan to null when no active plan', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(baseProfile);
    setupEmptyRepos();
    const ctx = await buildAthleteContext();
    expect(ctx?.currentWeek.trainingPlan).toBeNull();
    expect(ctx?.currentWeek.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(ctx?.currentWeek.weekEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns empty arrays for missing performance stats and activities', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(baseProfile);
    setupEmptyRepos();
    const ctx = await buildAthleteContext();
    expect(ctx?.performanceStats.sportMetrics).toEqual([]);
    expect(ctx?.performanceStats.racePredictions).toEqual([]);
    expect(ctx?.recentActivities).toEqual([]);
    expect(ctx?.trainingZones).toEqual([]);
    expect(ctx?.availability).toEqual([]);
  });
});

describe('saveContextSnapshot', () => {
  beforeEach(() => vi.resetAllMocks());

  it('throws 404 when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    await expect(saveContextSnapshot()).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('saves snapshot and returns dto with id and contextVersion', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(baseProfile);
    setupEmptyRepos();
    vi.mocked(ContextRepository.saveAthleteContextSnapshot).mockResolvedValue({
      id: 'snap-1',
      createdAt: new Date(),
      athleteProfileId: 'profile-1',
      contextVersion: 'v1',
      generatedAt: new Date('2024-06-10T09:00:00Z'),
      goalSummary: null,
      recentTrainingSummary: null,
      availabilitySummary: null,
      zoneSummary: null,
      recoverySummary: null,
      structuredContext: {},
    });
    const dto = await saveContextSnapshot();
    expect(dto.id).toBe('snap-1');
    expect(dto.contextVersion).toBe('v1');
    expect(dto.generatedAt).toBe('2024-06-10T09:00:00.000Z');
  });

  it('passes summaries to repository when goals and activities exist', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(baseProfile);
    setupEmptyRepos();
    vi.mocked(AthleteRepository.findAthleteGoals).mockResolvedValue([
      makeGoal('g1', 'Berlin Marathon', 'MainGoal'),
    ]);
    vi.mocked(ContextRepository.saveAthleteContextSnapshot).mockResolvedValue({
      id: 'snap-2',
      createdAt: new Date(),
      athleteProfileId: 'profile-1',
      contextVersion: 'v1',
      generatedAt: new Date(),
      goalSummary: 'Main goal: Berlin Marathon',
      recentTrainingSummary: null,
      availabilitySummary: null,
      zoneSummary: null,
      recoverySummary: null,
      structuredContext: {},
    });
    await saveContextSnapshot();
    const call = vi.mocked(ContextRepository.saveAthleteContextSnapshot).mock.calls[0]!;
    expect(call[2]?.goalSummary).toBe('Main goal: Berlin Marathon');
  });
});
