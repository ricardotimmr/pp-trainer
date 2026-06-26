import type { AiCoachOutput } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as AiProviderClient from '../../ai/AiProviderClient.js';
import * as ActivityRepository from '../../repositories/ActivityRepository.js';
import * as AiRepository from '../../repositories/AiRepository.js';
import * as AthleteRepository from '../../repositories/AthleteRepository.js';
import * as AthleteContextBuilder from '../../services/AthleteContextBuilder.js';
import { generateWeekAnalysis, generateWeekPlan, generateWorkout } from '../../services/AiService.js';

vi.mock('../../lib/prisma.js', () => ({ prisma: {}, disconnectPrisma: vi.fn() }));
vi.mock('../../repositories/AthleteRepository.js');
vi.mock('../../repositories/ActivityRepository.js');
vi.mock('../../services/AthleteContextBuilder.js');
vi.mock('../../ai/AiProviderClient.js');
vi.mock('../../repositories/AiRepository.js');

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockProfile = { id: 'profile-1', displayName: 'Test Athlete' };
const mockContext = { version: 'v1', generatedAt: '2026-06-23T10:00:00Z', athlete: { displayName: 'Test' } };
const mockSnapshot = { id: 'snap-1' };

const validWeekPlanData = {
  title: 'Base Week',
  weekStartDate: '2026-06-23',
  weekEndDate: '2026-06-29',
  summary: 'A balanced aerobic week.',
  workouts: [
    {
      title: 'Easy Run',
      sport: 'running',
      workoutType: 'easy',
      intensity: 'easy',
      scheduledDate: '2026-06-24',
      objective: 'Easy aerobic run',
      steps: [],
    },
  ],
};

const validSingleWorkoutData = {
  workout: {
    title: 'Interval Training',
    sport: 'running',
    workoutType: 'vo2max',
    intensity: 'vo2max',
    objective: 'Build VO2max with short intervals',
    steps: [],
  },
};

function makeDbOutput(overrides: Partial<AiCoachOutput> = {}): AiCoachOutput {
  return {
    id: 'output-1',
    athleteProfileId: 'profile-1',
    athleteContextSnapshotId: 'snap-1',
    outputType: 'WeekPlan',
    status: 'Draft',
    validationStatus: 'Valid',
    summary: null,
    rawText: null,
    structuredOutput: null,
    validationErrors: null,
    createdTrainingPlanId: null,
    createdPlannedWorkoutId: null,
    createdAt: new Date('2026-06-23T10:00:00.000Z'),
    updatedAt: new Date('2026-06-23T10:00:00.000Z'),
    ...overrides,
  } as unknown as AiCoachOutput;
}

// ── generateWeekPlan ──────────────────────────────────────────────────────────

describe('generateWeekPlan', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(AthleteContextBuilder.buildContext).mockResolvedValue(mockContext as never);
    vi.mocked(AthleteContextBuilder.persistSnapshot).mockResolvedValue(mockSnapshot as never);
    vi.mocked(AiProviderClient.generateWeekPlan).mockResolvedValue({
      data: validWeekPlanData,
      rawOutput: validWeekPlanData,
    } as never);
    vi.mocked(AiRepository.createOutput).mockResolvedValue(makeDbOutput({ summary: 'A balanced aerobic week.' }));
  });

  it('returns AiCoachOutputDto with correct shape', async () => {
    const result = await generateWeekPlan({ weekStartDate: '2026-06-23' });
    expect(result.outputType).toBe('week_plan');
    expect(result.status).toBe('draft');
    expect(result.validationStatus).toBe('valid');
    expect(result.id).toBe('output-1');
  });

  it('creates output with status Draft and validationStatus Valid when AI returns valid data', async () => {
    await generateWeekPlan({ weekStartDate: '2026-06-23' });
    expect(vi.mocked(AiRepository.createOutput)).toHaveBeenCalledWith(
      expect.objectContaining({
        outputType: 'WeekPlan',
        status: 'Draft',
        validationStatus: 'Valid',
      }),
    );
  });

  it('creates output with validationStatus Invalid when AI returns null data', async () => {
    vi.mocked(AiProviderClient.generateWeekPlan).mockResolvedValue({
      data: null,
      rawOutput: { raw: 'unparseable text' },
    } as never);
    vi.mocked(AiRepository.createOutput).mockResolvedValue(makeDbOutput({ validationStatus: 'Invalid' }));

    await generateWeekPlan({ weekStartDate: '2026-06-23' });

    expect(vi.mocked(AiRepository.createOutput)).toHaveBeenCalledWith(
      expect.objectContaining({ validationStatus: 'Invalid' }),
    );
  });

  it('stores the plan summary from AI output', async () => {
    await generateWeekPlan({ weekStartDate: '2026-06-23' });
    expect(vi.mocked(AiRepository.createOutput)).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'A balanced aerobic week.' }),
    );
  });

  it('does not store summary when AI output has none', async () => {
    vi.mocked(AiProviderClient.generateWeekPlan).mockResolvedValue({
      data: { ...validWeekPlanData, summary: undefined },
      rawOutput: validWeekPlanData,
    } as never);

    await generateWeekPlan({ weekStartDate: '2026-06-23' });

    const callArg = vi.mocked(AiRepository.createOutput).mock.calls[0]?.[0];
    expect(callArg).not.toHaveProperty('summary');
  });

  it('builds context and persists snapshot for the athlete profile', async () => {
    await generateWeekPlan({ weekStartDate: '2026-06-23' });
    expect(vi.mocked(AthleteContextBuilder.buildContext)).toHaveBeenCalledWith('profile-1');
    expect(vi.mocked(AthleteContextBuilder.persistSnapshot)).toHaveBeenCalledWith('profile-1', mockContext);
  });

  it('passes context, weekStartDate and userInstruction to the provider', async () => {
    await generateWeekPlan({ weekStartDate: '2026-06-23', userInstruction: 'Focus on cycling' });
    expect(vi.mocked(AiProviderClient.generateWeekPlan)).toHaveBeenCalledWith(
      mockContext,
      '2026-06-23',
      'Focus on cycling',
    );
  });

  it('throws 404 when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    await expect(generateWeekPlan({ weekStartDate: '2026-06-23' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('propagates provider errors without creating an output record', async () => {
    const providerError = new Error('OpenAI timeout');
    vi.mocked(AiProviderClient.generateWeekPlan).mockRejectedValue(providerError);

    await expect(generateWeekPlan({ weekStartDate: '2026-06-23' })).rejects.toThrow('OpenAI timeout');
    expect(vi.mocked(AiRepository.createOutput)).not.toHaveBeenCalled();
  });
});

// ── generateWorkout ───────────────────────────────────────────────────────────

describe('generateWorkout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(AthleteContextBuilder.buildContext).mockResolvedValue(mockContext as never);
    vi.mocked(AthleteContextBuilder.persistSnapshot).mockResolvedValue(mockSnapshot as never);
    vi.mocked(AiProviderClient.generateSingleWorkout).mockResolvedValue({
      data: validSingleWorkoutData,
      rawOutput: validSingleWorkoutData,
    } as never);
    vi.mocked(AiRepository.createOutput).mockResolvedValue(
      makeDbOutput({ outputType: 'SingleWorkout', summary: 'Build VO2max with short intervals' }),
    );
  });

  it('returns AiCoachOutputDto with outputType single_workout', async () => {
    const result = await generateWorkout({ sport: 'running', intensity: 'vo2max' });
    expect(result.outputType).toBe('single_workout');
    expect(result.status).toBe('draft');
    expect(result.validationStatus).toBe('valid');
  });

  it('creates output with outputType SingleWorkout and status Draft', async () => {
    await generateWorkout({ sport: 'running', intensity: 'vo2max' });
    expect(vi.mocked(AiRepository.createOutput)).toHaveBeenCalledWith(
      expect.objectContaining({
        outputType: 'SingleWorkout',
        status: 'Draft',
        validationStatus: 'Valid',
      }),
    );
  });

  it('creates output with validationStatus Invalid when AI returns null data', async () => {
    vi.mocked(AiProviderClient.generateSingleWorkout).mockResolvedValue({
      data: null,
      rawOutput: 'unparseable',
    } as never);
    vi.mocked(AiRepository.createOutput).mockResolvedValue(
      makeDbOutput({ outputType: 'SingleWorkout', validationStatus: 'Invalid' }),
    );

    await generateWorkout({ sport: 'running', intensity: 'vo2max' });

    expect(vi.mocked(AiRepository.createOutput)).toHaveBeenCalledWith(
      expect.objectContaining({ validationStatus: 'Invalid' }),
    );
  });

  it('uses workout objective as summary', async () => {
    await generateWorkout({ sport: 'running', intensity: 'vo2max' });
    expect(vi.mocked(AiRepository.createOutput)).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Build VO2max with short intervals' }),
    );
  });

  it('falls back to workout description for summary when objective is absent', async () => {
    vi.mocked(AiProviderClient.generateSingleWorkout).mockResolvedValue({
      data: {
        workout: {
          ...validSingleWorkoutData.workout,
          objective: undefined,
          description: 'A classic interval session.',
        },
      },
      rawOutput: validSingleWorkoutData,
    } as never);

    await generateWorkout({ sport: 'running', intensity: 'vo2max' });

    expect(vi.mocked(AiRepository.createOutput)).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'A classic interval session.' }),
    );
  });

  it('throws 404 when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    await expect(generateWorkout({ sport: 'running', intensity: 'easy' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('propagates provider errors without creating an output record', async () => {
    vi.mocked(AiProviderClient.generateSingleWorkout).mockRejectedValue(new Error('rate limited'));

    await expect(generateWorkout({ sport: 'running', intensity: 'easy' })).rejects.toThrow('rate limited');
    expect(vi.mocked(AiRepository.createOutput)).not.toHaveBeenCalled();
  });

  it('passes context and request fields to the provider', async () => {
    await generateWorkout({
      sport: 'cycling',
      intensity: 'threshold',
      plannedDurationSeconds: 3600,
      userInstruction: 'Three threshold blocks',
    });

    expect(vi.mocked(AiProviderClient.generateSingleWorkout)).toHaveBeenCalledWith(
      mockContext,
      'cycling',
      'threshold cycling workout',
      3600,
      'Three threshold blocks',
    );
  });
});

// ── generateWeekAnalysis ──────────────────────────────────────────────────────

const validWeekAnalysisData = {
  weekStartDate: '2026-06-15',
  weekEndDate: '2026-06-21',
  totalDurationSeconds: 10800,
  sportBreakdown: [{ sport: 'running', durationSeconds: 10800, activityCount: 2 }],
  keyObservations: ['Good aerobic volume this week.', 'Consistent effort across sessions.'],
  suggestedFocus: 'Add one quality interval session next week.',
  coachComment: 'Solid week overall.',
};

const mockActivityRow = {
  id: 'act-1',
  sport: 'Running',
  startTime: new Date('2026-06-16T08:00:00Z'),
  durationSeconds: 3600,
  distanceMeters: 10000,
  averageHeartRateBpm: 145,
  averagePowerWatts: null,
  averagePaceSecPerKm: 360,
};

describe('generateWeekAnalysis', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(ActivityRepository.findActivities).mockResolvedValue([mockActivityRow] as never);
    vi.mocked(AthleteContextBuilder.buildContext).mockResolvedValue(mockContext as never);
    vi.mocked(AthleteContextBuilder.persistSnapshot).mockResolvedValue(mockSnapshot as never);
    vi.mocked(AiProviderClient.generateWeekAnalysis).mockResolvedValue({
      data: validWeekAnalysisData,
      rawOutput: validWeekAnalysisData,
    } as never);
    vi.mocked(AiRepository.createOutput).mockResolvedValue(
      makeDbOutput({ outputType: 'WeekAnalysis', summary: 'Good aerobic volume this week.' }),
    );
  });

  it('returns AiCoachOutputDto with outputType week_analysis', async () => {
    const result = await generateWeekAnalysis({ weekStartDate: '2026-06-15' });
    expect(result.outputType).toBe('week_analysis');
    expect(result.status).toBe('draft');
    expect(result.validationStatus).toBe('valid');
  });

  it('creates output with outputType WeekAnalysis and status Draft', async () => {
    await generateWeekAnalysis({ weekStartDate: '2026-06-15' });
    expect(vi.mocked(AiRepository.createOutput)).toHaveBeenCalledWith(
      expect.objectContaining({
        outputType: 'WeekAnalysis',
        status: 'Draft',
        validationStatus: 'Valid',
      }),
    );
  });

  it('uses first keyObservation as summary', async () => {
    await generateWeekAnalysis({ weekStartDate: '2026-06-15' });
    expect(vi.mocked(AiRepository.createOutput)).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Good aerobic volume this week.' }),
    );
  });

  it('creates output with validationStatus Invalid when AI returns null data', async () => {
    vi.mocked(AiProviderClient.generateWeekAnalysis).mockResolvedValue({
      data: null,
      rawOutput: { raw: 'unparseable' },
    } as never);
    vi.mocked(AiRepository.createOutput).mockResolvedValue(
      makeDbOutput({ outputType: 'WeekAnalysis', validationStatus: 'Invalid' }),
    );

    await generateWeekAnalysis({ weekStartDate: '2026-06-15' });

    expect(vi.mocked(AiRepository.createOutput)).toHaveBeenCalledWith(
      expect.objectContaining({ validationStatus: 'Invalid' }),
    );
  });

  it('fetches activities for the given week', async () => {
    await generateWeekAnalysis({ weekStartDate: '2026-06-15' });
    expect(vi.mocked(ActivityRepository.findActivities)).toHaveBeenCalledWith(
      'profile-1',
      expect.objectContaining({
        startTimeFrom: new Date('2026-06-15T00:00:00Z'),
      }),
    );
  });

  it('defaults to last completed week when weekStartDate is omitted', async () => {
    await generateWeekAnalysis({});
    expect(vi.mocked(ActivityRepository.findActivities)).toHaveBeenCalled();
    expect(vi.mocked(AiProviderClient.generateWeekAnalysis)).toHaveBeenCalled();
  });

  it('throws 404 when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    await expect(generateWeekAnalysis({})).rejects.toMatchObject({ statusCode: 404 });
  });

  it('propagates provider errors without creating an output record', async () => {
    vi.mocked(AiProviderClient.generateWeekAnalysis).mockRejectedValue(new Error('provider down'));
    await expect(generateWeekAnalysis({ weekStartDate: '2026-06-15' })).rejects.toThrow('provider down');
    expect(vi.mocked(AiRepository.createOutput)).not.toHaveBeenCalled();
  });
});
