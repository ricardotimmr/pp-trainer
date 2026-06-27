import { describe, expect, it } from 'vitest';

import {
  AiGeneratedWeekPlanSchema,
  AiGeneratedWorkoutSchema,
  AiGeneratedWorkoutStepSchema,
  AiGeneratedSingleWorkoutSchema,
  AcceptAiOutputRequestSchema,
  GenerateWeekPlanRequestSchema,
  GenerateWorkoutRequestSchema,
} from '@pp-trainer/shared';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const validStep = {
  stepIndex: 0,
  stepType: 'warmup',
  instruction: '10 min easy jog',
};

const validWorkout = {
  title: 'Easy Run',
  sport: 'running',
  workoutType: 'endurance',
  intensity: 'easy',
  objective: 'Build aerobic base',
  description: 'Relaxed effort throughout',
  steps: [validStep],
};

const validWeekPlan = {
  title: 'Base Week',
  weekStartDate: '2026-06-22',
  weekEndDate: '2026-06-28',
  focus: 'Aerobic base',
  summary: 'Light week to build base fitness',
  workouts: [validWorkout],
};

// ── AiGeneratedWorkoutStepSchema ─────────────────────────────────────────────

describe('AiGeneratedWorkoutStepSchema', () => {
  it('passes a minimal valid step', () => {
    const result = AiGeneratedWorkoutStepSchema.safeParse(validStep);
    expect(result.success).toBe(true);
  });

  it('passes a step with all optional target fields', () => {
    const result = AiGeneratedWorkoutStepSchema.safeParse({
      ...validStep,
      stepIndex: 1,
      stepType: 'interval',
      title: 'Threshold block',
      durationSeconds: 600,
      distanceMeters: 2000,
      repetitions: 3,
      targetPowerLowerWatts: 280,
      targetPowerUpperWatts: 300,
      targetPaceLowerSecPerKm: 240,
      targetPaceUpperSecPerKm: 255,
      targetSwimPaceLowerSecPer100m: 90,
      targetSwimPaceUpperSecPer100m: 100,
      targetHeartRateZoneName: 'Zone 4',
      targetPowerZoneName: 'Sweet Spot',
      targetPaceZoneName: 'Threshold Pace',
      restSeconds: 120,
      notes: 'Stay relaxed on the shoulders',
    });
    expect(result.success).toBe(true);
  });

  it('fails when instruction is missing', () => {
    const { instruction: _instruction, ...withoutInstruction } = validStep;
    const result = AiGeneratedWorkoutStepSchema.safeParse(withoutInstruction);
    expect(result.success).toBe(false);
  });

  it('fails when instruction is empty', () => {
    const result = AiGeneratedWorkoutStepSchema.safeParse({ ...validStep, instruction: '' });
    expect(result.success).toBe(false);
  });

  it('fails with an invalid stepType', () => {
    const result = AiGeneratedWorkoutStepSchema.safeParse({ ...validStep, stepType: 'sprint' });
    expect(result.success).toBe(false);
  });

  it('fails with unknown fields (.strict())', () => {
    const result = AiGeneratedWorkoutStepSchema.safeParse({ ...validStep, unknownField: 'x' });
    expect(result.success).toBe(false);
  });

  it('fails when a numeric target field is negative', () => {
    const result = AiGeneratedWorkoutStepSchema.safeParse({
      ...validStep,
      durationSeconds: -1,
    });
    expect(result.success).toBe(false);
  });
});

// ── AiGeneratedWorkoutSchema ─────────────────────────────────────────────────

describe('AiGeneratedWorkoutSchema', () => {
  it('passes a valid workout', () => {
    const result = AiGeneratedWorkoutSchema.safeParse(validWorkout);
    expect(result.success).toBe(true);
  });

  it('passes a workout with only objective (no description)', () => {
    const { description: _description, ...noDescription } = validWorkout;
    const result = AiGeneratedWorkoutSchema.safeParse(noDescription);
    expect(result.success).toBe(true);
  });

  it('passes a workout with only description (no objective)', () => {
    const { objective: _objective, ...noObjective } = validWorkout;
    const result = AiGeneratedWorkoutSchema.safeParse(noObjective);
    expect(result.success).toBe(true);
  });

  it('passes a workout with no steps when description is provided', () => {
    const result = AiGeneratedWorkoutSchema.safeParse({
      ...validWorkout,
      steps: [],
    });
    expect(result.success).toBe(true);
  });

  it('fails when both objective and description are missing', () => {
    const { objective: _o, description: _d, ...noGoal } = validWorkout;
    const result = AiGeneratedWorkoutSchema.safeParse(noGoal);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('objective'))).toBe(true);
    }
  });

  it('fails when sport is missing', () => {
    const { sport: _sport, ...noSport } = validWorkout;
    const result = AiGeneratedWorkoutSchema.safeParse(noSport);
    expect(result.success).toBe(false);
  });

  it('fails with an invalid sport value', () => {
    const result = AiGeneratedWorkoutSchema.safeParse({ ...validWorkout, sport: 'unicycling' });
    expect(result.success).toBe(false);
  });

  it('fails when intensity is missing', () => {
    const { intensity: _intensity, ...noIntensity } = validWorkout;
    const result = AiGeneratedWorkoutSchema.safeParse(noIntensity);
    expect(result.success).toBe(false);
  });

  it('fails with an invalid intensity value', () => {
    const result = AiGeneratedWorkoutSchema.safeParse({ ...validWorkout, intensity: 'extreme' });
    expect(result.success).toBe(false);
  });

  it('fails when steps have duplicate stepIndex values', () => {
    const result = AiGeneratedWorkoutSchema.safeParse({
      ...validWorkout,
      steps: [
        { stepIndex: 0, stepType: 'warmup', instruction: 'Easy warm-up' },
        { stepIndex: 0, stepType: 'main', instruction: 'Main set' },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('steps'))).toBe(true);
    }
  });

  it('passes when steps have sequential unique stepIndex values', () => {
    const result = AiGeneratedWorkoutSchema.safeParse({
      ...validWorkout,
      steps: [
        { stepIndex: 0, stepType: 'warmup', instruction: 'Easy warm-up' },
        { stepIndex: 1, stepType: 'main', instruction: 'Main set' },
        { stepIndex: 2, stepType: 'cooldown', instruction: 'Cool down' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('fails with no steps AND no description', () => {
    const { objective: _o, description: _d, ...noGoal } = validWorkout;
    const result = AiGeneratedWorkoutSchema.safeParse({ ...noGoal, steps: [] });
    expect(result.success).toBe(false);
  });

  it('fails with unknown fields (.strict())', () => {
    const result = AiGeneratedWorkoutSchema.safeParse({ ...validWorkout, aiVersion: '1' });
    expect(result.success).toBe(false);
  });
});

// ── AcceptAiOutputRequestSchema ──────────────────────────────────────────────

describe('AcceptAiOutputRequestSchema', () => {
  it('passes an empty accept request', () => {
    const result = AcceptAiOutputRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('passes a valid single workout override', () => {
    const result = AcceptAiOutputRequestSchema.safeParse({
      singleWorkoutOverride: { workout: validWorkout },
    });
    expect(result.success).toBe(true);
  });

  it('fails with unknown fields', () => {
    const result = AcceptAiOutputRequestSchema.safeParse({
      unknown: true,
    });
    expect(result.success).toBe(false);
  });
});

// ── AiGeneratedWeekPlanSchema ────────────────────────────────────────────────

describe('AiGeneratedWeekPlanSchema', () => {
  it('passes a valid week plan', () => {
    const result = AiGeneratedWeekPlanSchema.safeParse(validWeekPlan);
    expect(result.success).toBe(true);
  });

  it('passes with multiple workouts', () => {
    const result = AiGeneratedWeekPlanSchema.safeParse({
      ...validWeekPlan,
      workouts: [
        validWorkout,
        { ...validWorkout, title: 'Long Ride', sport: 'cycling', scheduledDate: '2026-06-25' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('passes when focus and summary are omitted', () => {
    const { focus: _f, summary: _s, ...minimal } = validWeekPlan;
    const result = AiGeneratedWeekPlanSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('fails when workouts array is empty', () => {
    const result = AiGeneratedWeekPlanSchema.safeParse({ ...validWeekPlan, workouts: [] });
    expect(result.success).toBe(false);
  });

  it('fails when title is missing', () => {
    const { title: _title, ...noTitle } = validWeekPlan;
    const result = AiGeneratedWeekPlanSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it('fails when weekStartDate is missing', () => {
    const { weekStartDate: _start, ...noStart } = validWeekPlan;
    const result = AiGeneratedWeekPlanSchema.safeParse(noStart);
    expect(result.success).toBe(false);
  });

  it('fails when weekEndDate is before weekStartDate', () => {
    const result = AiGeneratedWeekPlanSchema.safeParse({
      ...validWeekPlan,
      weekStartDate: '2026-06-28',
      weekEndDate: '2026-06-22',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('weekEndDate'))).toBe(true);
    }
  });

  it('passes when weekEndDate equals weekStartDate', () => {
    const result = AiGeneratedWeekPlanSchema.safeParse({
      ...validWeekPlan,
      weekStartDate: '2026-06-22',
      weekEndDate: '2026-06-22',
    });
    expect(result.success).toBe(true);
  });

  it('fails with unknown fields (.strict())', () => {
    const result = AiGeneratedWeekPlanSchema.safeParse({ ...validWeekPlan, model: 'gpt-4' });
    expect(result.success).toBe(false);
  });

  it('fails when a workout in the plan has invalid sport', () => {
    const result = AiGeneratedWeekPlanSchema.safeParse({
      ...validWeekPlan,
      workouts: [{ ...validWorkout, sport: 'skateboarding' }],
    });
    expect(result.success).toBe(false);
  });
});

// ── AiGeneratedSingleWorkoutSchema ───────────────────────────────────────────

describe('AiGeneratedSingleWorkoutSchema', () => {
  it('passes a valid single workout output', () => {
    const result = AiGeneratedSingleWorkoutSchema.safeParse({ workout: validWorkout });
    expect(result.success).toBe(true);
  });

  it('fails when workout field is missing', () => {
    const result = AiGeneratedSingleWorkoutSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('fails with unknown fields (.strict())', () => {
    const result = AiGeneratedSingleWorkoutSchema.safeParse({
      workout: validWorkout,
      metadata: { model: 'claude' },
    });
    expect(result.success).toBe(false);
  });

  it('fails when nested workout is invalid', () => {
    const { sport: _sport, ...noSport } = validWorkout;
    const result = AiGeneratedSingleWorkoutSchema.safeParse({ workout: noSport });
    expect(result.success).toBe(false);
  });
});

// ── GenerateWeekPlanRequestSchema ────────────────────────────────────────────

describe('GenerateWeekPlanRequestSchema', () => {
  it('passes with weekStartDate only', () => {
    const result = GenerateWeekPlanRequestSchema.safeParse({ weekStartDate: '2026-06-22' });
    expect(result.success).toBe(true);
  });

  it('passes with weekStartDate and userInstruction', () => {
    const result = GenerateWeekPlanRequestSchema.safeParse({
      weekStartDate: '2026-06-22',
      userInstruction: 'Focus on cycling base. Monday is tight.',
    });
    expect(result.success).toBe(true);
  });

  it('fails when weekStartDate is missing', () => {
    const result = GenerateWeekPlanRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ── GenerateWorkoutRequestSchema ─────────────────────────────────────────────

describe('GenerateWorkoutRequestSchema', () => {
  it('passes with required fields only', () => {
    const result = GenerateWorkoutRequestSchema.safeParse({
      sport: 'cycling',
      intensity: 'threshold',
    });
    expect(result.success).toBe(true);
  });

  it('passes with all optional fields', () => {
    const result = GenerateWorkoutRequestSchema.safeParse({
      sport: 'running',
      intensity: 'easy',
      plannedDurationSeconds: 3600,
      plannedDistanceMeters: 10000,
      scheduledDate: '2026-06-24',
      userInstruction: 'Easy recovery run, flat terrain.',
    });
    expect(result.success).toBe(true);
  });

  it('fails when sport is missing', () => {
    const result = GenerateWorkoutRequestSchema.safeParse({ intensity: 'easy' });
    expect(result.success).toBe(false);
  });

  it('fails when intensity is missing', () => {
    const result = GenerateWorkoutRequestSchema.safeParse({ sport: 'cycling' });
    expect(result.success).toBe(false);
  });

  it('fails with an invalid sport value', () => {
    const result = GenerateWorkoutRequestSchema.safeParse({ sport: 'polo', intensity: 'easy' });
    expect(result.success).toBe(false);
  });

  it('fails with an invalid intensity value', () => {
    const result = GenerateWorkoutRequestSchema.safeParse({ sport: 'running', intensity: 'nuclear' });
    expect(result.success).toBe(false);
  });
});
