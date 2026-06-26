import {
  AiGeneratedSingleWorkoutSchema,
  AiGeneratedWeekAnalysisSchema,
  AiGeneratedWeekPlanSchema,
} from '@pp-trainer/shared';
import { describe, expect, it } from 'vitest';

import { MockProvider } from '../../ai/MockProvider.js';
import { buildSingleWorkoutPrompt, buildWeekAnalysisPrompt, buildWeekPlanPrompt } from '../../ai/PromptBuilder.js';
import type { AthleteContextForAi } from '../../types/athleteContext.js';

const minimalContext: AthleteContextForAi = {
  version: 'v1',
  generatedAt: '2026-06-23T10:00:00.000Z',
  athlete: { displayName: 'Test', primarySports: ['running'] },
  goals: [],
  availability: [],
  trainingZones: [],
  recentActivities: [],
  currentWeek: { weekStartDate: '2026-06-23', plannedWorkoutCount: 0, completedActivityCount: 0 },
};

const provider = new MockProvider();

describe('MockProvider.generateWeekPlan', () => {
  it('returns a valid AiGeneratedWeekPlan in data field', async () => {
    const prompt = buildWeekPlanPrompt(minimalContext, '2026-06-23');
    const result = await provider.generateWeekPlan(prompt);
    expect(result.data).not.toBeNull();
    const parsed = AiGeneratedWeekPlanSchema.safeParse(result.data);
    expect(parsed.success).toBe(true);
  });

  it('uses the weekStartDate from the prompt', async () => {
    const prompt = buildWeekPlanPrompt(minimalContext, '2026-07-07');
    const result = await provider.generateWeekPlan(prompt);
    expect(result.data?.weekStartDate).toBe('2026-07-07');
    expect(result.data?.weekEndDate).toBe('2026-07-13');
  });

  it('returns at least one workout', async () => {
    const prompt = buildWeekPlanPrompt(minimalContext, '2026-06-23');
    const result = await provider.generateWeekPlan(prompt);
    expect(result.data?.workouts.length).toBeGreaterThanOrEqual(1);
  });

  it('all workouts have unique stepIndices within each workout', async () => {
    const prompt = buildWeekPlanPrompt(minimalContext, '2026-06-23');
    const result = await provider.generateWeekPlan(prompt);
    for (const workout of result.data?.workouts ?? []) {
      const indices = workout.steps.map((s) => s.stepIndex);
      expect(new Set(indices).size).toBe(indices.length);
    }
  });

  it('falls back to today when prompt has no date', async () => {
    const promptWithoutDate = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Easy');
    const result = await provider.generateWeekPlan(promptWithoutDate);
    expect(result.data?.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rawOutput matches data', async () => {
    const prompt = buildWeekPlanPrompt(minimalContext, '2026-06-23');
    const result = await provider.generateWeekPlan(prompt);
    expect(result.rawOutput).toBe(result.data);
  });

  it('validationErrors is undefined for valid output', async () => {
    const prompt = buildWeekPlanPrompt(minimalContext, '2026-06-23');
    const result = await provider.generateWeekPlan(prompt);
    expect(result.validationErrors).toBeUndefined();
  });
});

describe('MockProvider.generateSingleWorkout', () => {
  it('returns a valid AiGeneratedSingleWorkout in data field', async () => {
    const prompt = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Interval training', 3600);
    const result = await provider.generateSingleWorkout(prompt);
    expect(result.data).not.toBeNull();
    const parsed = AiGeneratedSingleWorkoutSchema.safeParse(result.data);
    expect(parsed.success).toBe(true);
  });

  it('has at least one step', async () => {
    const prompt = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Tempo', 3600);
    const result = await provider.generateSingleWorkout(prompt);
    expect(result.data?.workout.steps.length).toBeGreaterThanOrEqual(1);
  });

  it('all steps have unique stepIndices', async () => {
    const prompt = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Interval', 3600);
    const result = await provider.generateSingleWorkout(prompt);
    const indices = result.data?.workout.steps.map((s) => s.stepIndex) ?? [];
    expect(new Set(indices).size).toBe(indices.length);
  });

  it('workout has objective or description', async () => {
    const prompt = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Easy jog');
    const result = await provider.generateSingleWorkout(prompt);
    expect(
      result.data?.workout.objective != null || result.data?.workout.description != null,
    ).toBe(true);
  });

  it('validationErrors is undefined for valid output', async () => {
    const prompt = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Easy jog');
    const result = await provider.generateSingleWorkout(prompt);
    expect(result.validationErrors).toBeUndefined();
  });
});

describe('MockProvider.generateWeekAnalysis', () => {
  it('aggregates real activity data from the prompt', async () => {
    const prompt = buildWeekAnalysisPrompt(minimalContext, {
      weekStartDate: '2026-06-22',
      weekEndDate: '2026-06-28',
      activities: [
        {
          sport: 'cycling',
          startTime: '2026-06-22T07:00:00.000Z',
          durationSeconds: 3600,
          distanceMeters: 30000,
        },
        {
          sport: 'running',
          startTime: '2026-06-23T07:00:00.000Z',
          durationSeconds: 2700,
          distanceMeters: 8000,
        },
        {
          sport: 'swimming',
          startTime: '2026-06-24T07:00:00.000Z',
          durationSeconds: 1800,
          distanceMeters: 1500,
        },
        {
          sport: 'strength',
          startTime: '2026-06-25T07:00:00.000Z',
          durationSeconds: 2400,
        },
      ],
    });

    const result = await provider.generateWeekAnalysis(prompt);

    expect(result.data?.totalDurationSeconds).toBe(10500);
    expect(result.data?.totalDistanceMeters).toBe(39500);
    expect(result.data?.sportBreakdown).toEqual([
      { sport: 'cycling', durationSeconds: 3600, distanceMeters: 30000, activityCount: 1 },
      { sport: 'running', durationSeconds: 2700, distanceMeters: 8000, activityCount: 1 },
      { sport: 'strength', durationSeconds: 2400, activityCount: 1 },
      { sport: 'swimming', durationSeconds: 1800, distanceMeters: 1500, activityCount: 1 },
    ]);
  });

  it('returns a valid empty analysis when the prompt has no activities', async () => {
    const prompt = buildWeekAnalysisPrompt(minimalContext, {
      weekStartDate: '2026-06-22',
      weekEndDate: '2026-06-28',
      activities: [],
    });

    const result = await provider.generateWeekAnalysis(prompt);

    expect(result.data?.totalDurationSeconds).toBe(0);
    expect(result.data?.sportBreakdown).toEqual([]);
    expect(AiGeneratedWeekAnalysisSchema.safeParse(result.data).success).toBe(true);
  });
});
