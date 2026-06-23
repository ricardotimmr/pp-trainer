import { describe, expect, it } from 'vitest';

import {
  CreatePlannedWorkoutRequestSchema,
  CreateTrainingPlanRequestSchema,
  UpdatePlannedWorkoutRequestSchema,
  UpdateTrainingPlanRequestSchema,
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
    const { title: _title, ...withoutTitle } = valid;
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
    const { sport: _sport, ...withoutSport } = valid;
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

  it('passes with explicit source field (L9)', () => {
    const result = CreatePlannedWorkoutRequestSchema.safeParse({ ...valid, source: 'ai_generated' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.source).toBe('ai_generated');
  });

  it('fails with an invalid source value', () => {
    const result = CreatePlannedWorkoutRequestSchema.safeParse({ ...valid, source: 'gps_watch' });
    expect(result.success).toBe(false);
  });
});

// ── CreateTrainingPlanRequestSchema — source field (L9) ───────────────────────

describe('CreateTrainingPlanRequestSchema — source', () => {
  const valid = { title: 'Base Phase', startDate: '2024-06-03', endDate: '2024-08-25' };

  it('passes with an explicit source field', () => {
    const result = CreateTrainingPlanRequestSchema.safeParse({ ...valid, source: 'template' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.source).toBe('template');
  });

  it('passes without source (defaults to undefined)', () => {
    const result = CreateTrainingPlanRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.source).toBeUndefined();
  });

  it('fails with an invalid source value', () => {
    const result = CreateTrainingPlanRequestSchema.safeParse({ ...valid, source: 'garmin' });
    expect(result.success).toBe(false);
  });
});

// ── UpdateTrainingPlanRequestSchema (L6) ─────────────────────────────────────

describe('UpdateTrainingPlanRequestSchema', () => {
  it('passes an empty object (all fields optional)', () => {
    const result = UpdateTrainingPlanRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('passes with only a title update', () => {
    const result = UpdateTrainingPlanRequestSchema.safeParse({ title: 'New Title' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe('New Title');
  });

  it('passes with only a startDate update', () => {
    const result = UpdateTrainingPlanRequestSchema.safeParse({ startDate: '2024-07-01' });
    expect(result.success).toBe(true);
  });

  it('passes when both dates are provided and end >= start', () => {
    const result = UpdateTrainingPlanRequestSchema.safeParse({
      startDate: '2024-06-01',
      endDate: '2024-08-01',
    });
    expect(result.success).toBe(true);
  });

  it('fails when both dates are provided and endDate < startDate', () => {
    const result = UpdateTrainingPlanRequestSchema.safeParse({
      startDate: '2024-08-01',
      endDate: '2024-06-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('endDate'))).toBe(true);
    }
  });

  it('passes when only one date is provided (cross-check deferred to service)', () => {
    const result = UpdateTrainingPlanRequestSchema.safeParse({ startDate: '2024-12-01' });
    expect(result.success).toBe(true);
  });

  it('fails with an invalid status value', () => {
    const result = UpdateTrainingPlanRequestSchema.safeParse({ status: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('passes with a valid status update', () => {
    const result = UpdateTrainingPlanRequestSchema.safeParse({ status: 'archived' });
    expect(result.success).toBe(true);
  });
});

// ── UpdatePlannedWorkoutRequestSchema (L6) ────────────────────────────────────

describe('UpdatePlannedWorkoutRequestSchema', () => {
  it('passes an empty object (all fields optional)', () => {
    const result = UpdatePlannedWorkoutRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('passes with only a title update', () => {
    const result = UpdatePlannedWorkoutRequestSchema.safeParse({ title: 'Updated Title' });
    expect(result.success).toBe(true);
  });

  it('passes with only a status update', () => {
    const result = UpdatePlannedWorkoutRequestSchema.safeParse({ status: 'completed' });
    expect(result.success).toBe(true);
  });

  it('fails with an invalid sport value', () => {
    const result = UpdatePlannedWorkoutRequestSchema.safeParse({ sport: 'skateboarding' });
    expect(result.success).toBe(false);
  });

  it('passes with a valid partial sport + intensity', () => {
    const result = UpdatePlannedWorkoutRequestSchema.safeParse({
      sport: 'cycling',
      intensity: 'threshold',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sport).toBe('cycling');
      expect(result.data.intensity).toBe('threshold');
    }
  });
});
