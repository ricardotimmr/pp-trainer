import { describe, expect, it } from 'vitest';

import {
  CreatePlannedWorkoutRequestSchema,
  CreateTrainingPlanRequestSchema,
} from '@pp-trainer/shared';

// ── CreateTrainingPlanRequestSchema ──────────────────────────────────────────

describe('CreateTrainingPlanRequestSchema', () => {
  const valid = {
    title: 'Base Phase',
    startDate: '2024-06-03',
    endDate: '2024-08-25',
  };

  it('passes a valid minimal payload and defaults status to draft', () => {
    const result = CreateTrainingPlanRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('draft');
  });

  it('passes with an explicit status', () => {
    const result = CreateTrainingPlanRequestSchema.safeParse({ ...valid, status: 'active' });
    expect(result.success).toBe(true);
  });

  it('fails when title is missing', () => {
    const { title: _, ...withoutTitle } = valid;
    const result = CreateTrainingPlanRequestSchema.safeParse(withoutTitle);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true);
    }
  });

  it('fails when endDate is before startDate', () => {
    const result = CreateTrainingPlanRequestSchema.safeParse({
      ...valid,
      startDate: '2024-08-25',
      endDate: '2024-06-03',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('endDate'))).toBe(true);
    }
  });

  it('passes when endDate equals startDate', () => {
    const result = CreateTrainingPlanRequestSchema.safeParse({
      ...valid,
      startDate: '2024-06-03',
      endDate: '2024-06-03',
    });
    expect(result.success).toBe(true);
  });

  it('fails with an invalid status value', () => {
    const result = CreateTrainingPlanRequestSchema.safeParse({ ...valid, status: 'running' });
    expect(result.success).toBe(false);
  });

  it('fails with a non-ISO date string', () => {
    const result = CreateTrainingPlanRequestSchema.safeParse({
      ...valid,
      startDate: '3 June 2024',
    });
    expect(result.success).toBe(false);
  });
});

// ── CreatePlannedWorkoutRequestSchema ────────────────────────────────────────

describe('CreatePlannedWorkoutRequestSchema', () => {
  const valid = {
    title: 'Easy Run',
    sport: 'running',
    workoutType: 'endurance',
    scheduledDate: '2024-06-10',
    intensity: 'easy',
  };

  const step0 = { stepIndex: 0, stepType: 'warmup', instruction: '10 min easy jog' };
  const step1 = { stepIndex: 1, stepType: 'main', instruction: '30 min at tempo pace' };

  it('passes a valid minimal payload and defaults steps/status', () => {
    const result = CreatePlannedWorkoutRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.steps).toEqual([]);
      expect(result.data.status).toBe('planned');
    }
  });

  it('passes a valid payload with two steps', () => {
    const result = CreatePlannedWorkoutRequestSchema.safeParse({
      ...valid,
      steps: [step0, step1],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.steps).toHaveLength(2);
  });

  it('fails when sport is missing', () => {
    const { sport: _, ...withoutSport } = valid;
    const result = CreatePlannedWorkoutRequestSchema.safeParse(withoutSport);
    expect(result.success).toBe(false);
  });

  it('fails with an invalid sport value', () => {
    const result = CreatePlannedWorkoutRequestSchema.safeParse({
      ...valid,
      sport: 'unicycling',
    });
    expect(result.success).toBe(false);
  });

  it('fails when step instruction is empty', () => {
    const result = CreatePlannedWorkoutRequestSchema.safeParse({
      ...valid,
      steps: [{ ...step0, instruction: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('fails when step stepType is invalid', () => {
    const result = CreatePlannedWorkoutRequestSchema.safeParse({
      ...valid,
      steps: [{ ...step0, stepType: 'not-a-type' }],
    });
    expect(result.success).toBe(false);
  });
});
