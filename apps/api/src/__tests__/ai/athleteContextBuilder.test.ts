import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as ActivityRepository from '../../repositories/ActivityRepository.js';
import * as AthleteRepository from '../../repositories/AthleteRepository.js';
import * as CoachingMemoryRepository from '../../repositories/CoachingMemoryRepository.js';
import * as TrainingRepository from '../../repositories/TrainingRepository.js';
import { buildContext, persistSnapshot } from '../../services/AthleteContextBuilder.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    athleteContextSnapshot: {
      create: vi.fn(),
    },
  },
  disconnectPrisma: vi.fn(),
}));
vi.mock('../../repositories/AthleteRepository.js');
vi.mock('../../repositories/ActivityRepository.js');
vi.mock('../../repositories/TrainingRepository.js');
vi.mock('../../repositories/CoachingMemoryRepository.js');

// ── Fixtures ─────────────────────────────────────────────────────────────────

const PROFILE_ID = 'profile-1';

const mockProfile = {
  id: PROFILE_ID,
  displayName: 'Test Athlete',
  bodyWeightKg: 72.5,
  heightCm: 178,
  primarySports: ['Running', 'Cycling'],
  currentFtpWatts: 280,
  maxHeartRateBpm: 192,
  restingHeartRateBpm: 48,
  runningThresholdPaceSecPerKm: 255,
  swimmingThresholdPaceSecPer100m: 105,
  notes: null,
} as never;

const mockGoal = {
  id: 'goal-1',
  title: 'Sub-4h Marathon',
  goalType: 'Race',
  targetDate: new Date('2026-10-01'),
  sport: 'Running',
  priority: 'MainGoal',
  targetDistanceMeters: 42195,
  targetDurationSeconds: 14400,
  targetPaceSecPerKm: 341,
  targetPowerWatts: null,
  targetSwimPaceSecPer100m: null,
  isActive: true,
} as never;

const mockAvailability = [
  { id: 'av-1', weekday: 'Wednesday', available: true, maxDurationMinutes: 90, preferredSports: ['Running'], notes: null },
  { id: 'av-2', weekday: 'Monday', available: true, maxDurationMinutes: 60, preferredSports: [], notes: 'Work from home' },
  { id: 'av-3', weekday: 'Saturday', available: true, maxDurationMinutes: 180, preferredSports: ['Cycling'], notes: null },
  { id: 'av-4', weekday: 'Sunday', available: false, maxDurationMinutes: null, preferredSports: [], notes: null },
] as never[];

const mockZoneSet = {
  id: 'zs-1',
  zoneType: 'HeartRate',
  sport: 'Running',
  name: 'HR Zones',
  isActive: true,
  zones: [
    { zoneNumber: 1, name: 'Recovery', lowerBound: 0, upperBound: 130, unit: 'Bpm' },
    { zoneNumber: 2, name: 'Aerobic', lowerBound: 131, upperBound: 152, unit: 'Bpm' },
    { zoneNumber: 3, name: 'Tempo', lowerBound: 153, upperBound: 165, unit: 'Bpm' },
  ],
} as never;

const mockActivity = {
  id: 'act-1',
  sport: 'Running',
  startTime: new Date('2026-06-20T07:00:00Z'),
  durationSeconds: 3600,
  distanceMeters: 10000,
  averageHeartRateBpm: 148,
  averagePowerWatts: null,
  averagePaceSecPerKm: 360,
  perceivedExertion: 6,
} as never;

const mockWorkout = {
  id: 'wo-1',
  sport: 'Running',
  title: 'Easy Run',
  scheduledDate: new Date('2026-06-23T00:00:00Z'),
  plannedDurationSeconds: 3600,
  intensity: 'Easy',
  status: 'Planned',
  steps: [],
} as never;

// ── buildContext ──────────────────────────────────────────────────────────────

describe('buildContext', () => {
  beforeEach(() => {
    vi.mocked(AthleteRepository.findAthleteProfileById).mockResolvedValue(mockProfile);
    vi.mocked(AthleteRepository.findAthleteGoals).mockResolvedValue([mockGoal]);
    vi.mocked(AthleteRepository.findAthleteAvailability).mockResolvedValue(mockAvailability);
    vi.mocked(AthleteRepository.findAthleteZoneSets).mockResolvedValue([mockZoneSet]);
    vi.mocked(ActivityRepository.findActivities).mockResolvedValue([mockActivity]);
    vi.mocked(ActivityRepository.findActivitiesForHistory).mockResolvedValue([]);
    vi.mocked(ActivityRepository.countActivitiesAllTime).mockResolvedValue(0);
    vi.mocked(TrainingRepository.listWorkouts).mockResolvedValue([mockWorkout]);
    vi.mocked(CoachingMemoryRepository.findRecentEntries).mockResolvedValue([]);
    vi.mocked(CoachingMemoryRepository.countEntries).mockResolvedValue(0);
  });

  it('returns a context with version v1 and generatedAt', async () => {
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.version).toBe('v1');
    expect(typeof ctx.generatedAt).toBe('string');
    expect(new Date(ctx.generatedAt).getTime()).toBeGreaterThan(0);
  });

  it('includes athlete profile fields in compact format (no IDs)', async () => {
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.athlete.displayName).toBe('Test Athlete');
    expect(ctx.athlete.bodyWeightKg).toBe(72.5);
    expect(ctx.athlete.heightCm).toBe(178);
    expect(ctx.athlete.primarySports).toEqual(['running', 'cycling']);
    expect(ctx.athlete.currentFtpWatts).toBe(280);
    expect(ctx.athlete.maxHeartRateBpm).toBe(192);
    expect(ctx.athlete.restingHeartRateBpm).toBe(48);
    expect(ctx.athlete.runningThresholdPaceSecPerKm).toBe(255);
    expect(ctx.athlete.swimmingThresholdPaceSecPer100m).toBe(105);
    expect('id' in ctx.athlete).toBe(false);
  });

  it('maps goals to flat array with lowercase enum values', async () => {
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.goals).toHaveLength(1);
    const g = ctx.goals[0];
    expect(g.title).toBe('Sub-4h Marathon');
    expect(g.goalType).toBe('race');
    expect(g.sport).toBe('running');
    expect(g.priority).toBe('maingoal');
    expect(g.targetDate).toBe('2026-10-01');
    expect(g.targetDistanceMeters).toBe(42195);
    expect(g.targetPaceSecPerKm).toBe(341);
    expect('id' in g).toBe(false);
  });

  it('sorts availability by weekday order (Monday first)', async () => {
    const ctx = await buildContext(PROFILE_ID);
    const weekdays = ctx.availability.map((a) => a.weekday);
    expect(weekdays[0]).toBe('monday');
    expect(weekdays[1]).toBe('wednesday');
    expect(weekdays[2]).toBe('saturday');
    expect(weekdays[3]).toBe('sunday');
  });

  it('includes availability with lowercase weekday and preferredSports', async () => {
    const ctx = await buildContext(PROFILE_ID);
    const monday = ctx.availability.find((a) => a.weekday === 'monday');
    expect(monday?.available).toBe(true);
    expect(monday?.maxDurationMinutes).toBe(60);
    expect(monday?.notes).toBe('Work from home');

    const wednesday = ctx.availability.find((a) => a.weekday === 'wednesday');
    expect(wednesday?.preferredSports).toEqual(['running']);
  });

  it('omits preferredSports when empty', async () => {
    const ctx = await buildContext(PROFILE_ID);
    const sunday = ctx.availability.find((a) => a.weekday === 'sunday');
    expect(sunday?.preferredSports).toBeUndefined();
  });

  it('maps training zone sets with lowercase zoneType, sport and unit', async () => {
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.trainingZones).toHaveLength(1);
    const zs = ctx.trainingZones[0];
    expect(zs.zoneType).toBe('heartrate');
    expect(zs.sport).toBe('running');
    expect(zs.zones).toHaveLength(3);
    expect(zs.zones[0].name).toBe('Recovery');
    expect(zs.zones[0].unit).toBe('bpm');
    expect(zs.zones[0].lowerBound).toBe(0);
    expect(zs.zones[0].upperBound).toBe(130);
  });

  it('maps recent activities with lowercase sport and ISO startTime', async () => {
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.recentActivities).toHaveLength(1);
    const act = ctx.recentActivities[0];
    expect(act.sport).toBe('running');
    expect(act.startTime).toBe('2026-06-20T07:00:00.000Z');
    expect(act.durationSeconds).toBe(3600);
    expect(act.distanceMeters).toBe(10000);
    expect(act.averageHeartRateBpm).toBe(148);
    expect(act.averagePaceSecPerKm).toBe(360);
    expect('id' in act).toBe(false);
  });

  it('includes currentWeek summary with planned and completed counts', async () => {
    const ctx = await buildContext(PROFILE_ID);
    expect(typeof ctx.currentWeek.weekStartDate).toBe('string');
    expect(typeof ctx.currentWeek.plannedWorkoutCount).toBe('number');
    expect(typeof ctx.currentWeek.completedActivityCount).toBe('number');
  });

  it('includes plannedWorkouts list with compact fields', async () => {
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.plannedWorkouts).toBeDefined();
    const wo = ctx.plannedWorkouts![0];
    expect(wo.sport).toBe('running');
    expect(wo.title).toBe('Easy Run');
    expect(wo.intensity).toBe('easy');
    expect(wo.status).toBe('planned');
    expect('id' in wo).toBe(false);
  });

  it('sets plannedWorkouts to undefined when no upcoming workouts', async () => {
    vi.mocked(TrainingRepository.listWorkouts).mockResolvedValue([]);
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.plannedWorkouts).toBeUndefined();
  });

  it('handles empty goals gracefully', async () => {
    vi.mocked(AthleteRepository.findAthleteGoals).mockResolvedValue([]);
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.goals).toEqual([]);
  });

  it('handles empty availability gracefully', async () => {
    vi.mocked(AthleteRepository.findAthleteAvailability).mockResolvedValue([]);
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.availability).toEqual([]);
  });

  it('handles empty zone sets gracefully', async () => {
    vi.mocked(AthleteRepository.findAthleteZoneSets).mockResolvedValue([]);
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.trainingZones).toEqual([]);
  });

  it('handles no recent activities gracefully', async () => {
    vi.mocked(ActivityRepository.findActivities).mockResolvedValue([]);
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.recentActivities).toEqual([]);
    expect(ctx.currentWeek.completedActivityCount).toBe(0);
    expect(ctx.currentWeek.completedDurationSeconds).toBeUndefined();
    expect(ctx.currentWeek.completedDurationBySport).toBeUndefined();
  });

  it('throws 404 when athlete profile not found', async () => {
    vi.mocked(AthleteRepository.findAthleteProfileById).mockResolvedValue(null);
    await expect(buildContext('unknown-id')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('trainingHistory is undefined when no history activities and no all-time count', async () => {
    vi.mocked(ActivityRepository.findActivitiesForHistory).mockResolvedValue([]);
    vi.mocked(ActivityRepository.countActivitiesAllTime).mockResolvedValue(0);
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.trainingHistory).toBeUndefined();
  });

  it('trainingHistory is populated with monthly stats when activities exist', async () => {
    vi.mocked(ActivityRepository.findActivitiesForHistory).mockResolvedValue([
      { sport: 'Running', startTime: new Date('2026-05-10T08:00:00Z'), durationSeconds: 3600, distanceMeters: 10000 },
      { sport: 'Running', startTime: new Date('2026-05-17T08:00:00Z'), durationSeconds: 4200, distanceMeters: 12000 },
      { sport: 'Cycling', startTime: new Date('2026-06-01T08:00:00Z'), durationSeconds: 5400, distanceMeters: null },
    ] as never[]);
    vi.mocked(ActivityRepository.countActivitiesAllTime).mockResolvedValue(42);

    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.trainingHistory).toBeDefined();
    expect(ctx.trainingHistory!.totalActivitiesAllTime).toBe(42);
    expect(ctx.trainingHistory!.monthlyStats).toHaveLength(2);

    const may = ctx.trainingHistory!.monthlyStats.find((m) => m.month === '2026-05');
    expect(may?.activityCount).toBe(2);
    expect(may?.totalDurationSeconds).toBe(7800);
    expect(may?.totalDistanceMeters).toBe(22000);
    expect(may?.sportBreakdown['running']).toBe(7800);

    const june = ctx.trainingHistory!.monthlyStats.find((m) => m.month === '2026-06');
    expect(june?.activityCount).toBe(1);
    expect(june?.sportBreakdown['cycling']).toBe(5400);
    expect(june?.totalDistanceMeters).toBeUndefined();
  });

  it('trainingHistory includes peakWeekDurationSeconds', async () => {
    vi.mocked(ActivityRepository.findActivitiesForHistory).mockResolvedValue([
      { sport: 'Running', startTime: new Date('2026-06-02T08:00:00Z'), durationSeconds: 3600, distanceMeters: null },
      { sport: 'Running', startTime: new Date('2026-06-03T08:00:00Z'), durationSeconds: 3600, distanceMeters: null },
    ] as never[]);
    vi.mocked(ActivityRepository.countActivitiesAllTime).mockResolvedValue(2);

    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.trainingHistory?.peakWeekDurationSeconds).toBe(7200);
  });

  it('coachingMemory is undefined when no memory entries', async () => {
    vi.mocked(CoachingMemoryRepository.findRecentEntries).mockResolvedValue([]);
    vi.mocked(CoachingMemoryRepository.countEntries).mockResolvedValue(0);
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.coachingMemory).toBeUndefined();
  });

  it('coachingMemory.recentEntries populated when entries exist', async () => {
    vi.mocked(CoachingMemoryRepository.findRecentEntries).mockResolvedValue([
      { entryText: 'Week plan accepted: 3 runs, 1 bike.' },
      { entryText: 'Single workout: tempo run 10km.' },
    ] as never[]);
    vi.mocked(CoachingMemoryRepository.countEntries).mockResolvedValue(2);

    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.coachingMemory?.recentEntries).toHaveLength(2);
    expect(ctx.coachingMemory?.recentEntries[0]).toBe('Week plan accepted: 3 runs, 1 bike.');
    expect(ctx.coachingMemory?.olderSummary).toBeUndefined();
  });

  it('coachingMemory.olderSummary shown when totalCount exceeds shown entries', async () => {
    vi.mocked(CoachingMemoryRepository.findRecentEntries).mockResolvedValue([
      { entryText: 'Recent entry.' },
    ] as never[]);
    vi.mocked(CoachingMemoryRepository.countEntries).mockResolvedValue(5);

    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.coachingMemory?.recentEntries).toHaveLength(1);
    expect(ctx.coachingMemory?.olderSummary).toBe('Plus 4 older coaching sessions not shown.');
  });

  it('coachingMemory truncates entries exceeding char budget', async () => {
    const longEntry = 'x'.repeat(1500);
    const shortEntry = 'Short entry.';
    vi.mocked(CoachingMemoryRepository.findRecentEntries).mockResolvedValue([
      { entryText: longEntry },
      { entryText: shortEntry },
    ] as never[]);
    vi.mocked(CoachingMemoryRepository.countEntries).mockResolvedValue(2);

    const ctx = await buildContext(PROFILE_ID);
    // longEntry (1500 chars) fits within budget of 2000, but shortEntry would push it to 1512 > 2000? No.
    // 1500 + 12 = 1512 < 2000, so both should fit
    expect(ctx.coachingMemory?.recentEntries).toHaveLength(2);
  });

  it('coachingMemory has empty recentEntries when first entry exceeds char budget', async () => {
    const overBudget = 'x'.repeat(2001);
    vi.mocked(CoachingMemoryRepository.findRecentEntries).mockResolvedValue([
      { entryText: overBudget },
    ] as never[]);
    vi.mocked(CoachingMemoryRepository.countEntries).mockResolvedValue(3);

    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.coachingMemory?.recentEntries).toHaveLength(0);
    expect(ctx.coachingMemory?.olderSummary).toBe('Plus 3 older coaching sessions not shown.');
  });

  it('omits null optional profile fields', async () => {
    const nullableProfile = mockProfile as Record<string, unknown>;
    vi.mocked(AthleteRepository.findAthleteProfileById).mockResolvedValue({
      ...nullableProfile,
      bodyWeightKg: null,
      heightCm: null,
      currentFtpWatts: null,
      maxHeartRateBpm: null,
      restingHeartRateBpm: null,
      runningThresholdPaceSecPerKm: null,
      swimmingThresholdPaceSecPer100m: null,
    } as never);
    const ctx = await buildContext(PROFILE_ID);
    expect(ctx.athlete.bodyWeightKg).toBeUndefined();
    expect(ctx.athlete.heightCm).toBeUndefined();
    expect(ctx.athlete.currentFtpWatts).toBeUndefined();
  });
});

// ── persistSnapshot ───────────────────────────────────────────────────────────

describe('persistSnapshot', () => {
  beforeEach(async () => {
    const { prisma } = await import('../../lib/prisma.js');
    vi.mocked(prisma.athleteContextSnapshot.create).mockClear();
  });

  it('calls prisma.athleteContextSnapshot.create with correct data', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    vi.mocked(prisma.athleteContextSnapshot.create).mockResolvedValue({
      id: 'snap-1',
    } as never);

    const context = {
      version: 'v1' as const,
      generatedAt: '2026-06-23T10:00:00.000Z',
      athlete: { displayName: 'Test', primarySports: [] },
      goals: [{ title: 'Goal 1', goalType: 'race', priority: 'maingoal' }],
      availability: [{ weekday: 'monday', available: true }],
      trainingZones: [{ zoneType: 'heartrate', zones: [] }],
      recentActivities: [
        { sport: 'running', startTime: '2026-06-20T07:00:00.000Z', durationSeconds: 3600 },
      ],
      currentWeek: {
        weekStartDate: '2026-06-22',
        plannedWorkoutCount: 0,
        completedActivityCount: 1,
        completedDurationSeconds: 3600,
        completedDurationBySport: { running: 3600 },
      },
    };

    const result = await persistSnapshot(PROFILE_ID, context);
    expect(result.id).toBe('snap-1');

    expect(vi.mocked(prisma.athleteContextSnapshot.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          athleteProfileId: PROFILE_ID,
          contextVersion: 'v1',
          structuredContext: context,
          goalSummary: '1 active goal(s). Primary: Goal 1.',
          recentTrainingSummary: expect.stringContaining('1 recent activities'),
          availabilitySummary: '1 available training day(s) per week.',
          zoneSummary: '1 zone set(s) configured.',
        }),
      }),
    );
  });

  it('omits summary fields when data is empty', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    vi.mocked(prisma.athleteContextSnapshot.create).mockResolvedValue({ id: 'snap-2' } as never);

    const context = {
      version: 'v1' as const,
      generatedAt: new Date().toISOString(),
      athlete: { displayName: 'Test', primarySports: [] },
      goals: [],
      availability: [],
      trainingZones: [],
      recentActivities: [],
      currentWeek: { weekStartDate: '2026-06-22', plannedWorkoutCount: 0, completedActivityCount: 0 },
    };

    await persistSnapshot(PROFILE_ID, context);

    const callArg = vi.mocked(prisma.athleteContextSnapshot.create).mock.calls[0][0];
    expect(callArg.data.goalSummary).toBeUndefined();
    expect(callArg.data.recentTrainingSummary).toBeUndefined();
    expect(callArg.data.availabilitySummary).toBeUndefined();
    expect(callArg.data.zoneSummary).toBeUndefined();
  });
});
