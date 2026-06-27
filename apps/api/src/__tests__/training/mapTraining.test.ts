import type { CompletedWorkoutLink, PlannedWorkout, TrainingPlan, WorkoutStep } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { mapPlannedWorkout, mapTrainingPlan, mapWorkoutStep } from '../../mappers/mapTraining.js';
import type {
  TrainingPlanWithWorkouts,
  WorkoutWithSteps,
} from '../../repositories/TrainingRepository.js';

const basePlan: TrainingPlan = {
  id: 'plan-1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  athleteProfileId: 'profile-1',
  title: 'Base Phase',
  description: 'Build aerobic base',
  startDate: new Date('2024-06-03T00:00:00Z'),
  endDate: new Date('2024-08-25T00:00:00Z'),
  status: 'Active',
  source: 'Manual',
  goalId: 'goal-1',
  aiCoachOutputId: null,
};

const baseWorkout: PlannedWorkout = {
  id: 'wo-1',
  createdAt: new Date('2024-06-01T00:00:00Z'),
  updatedAt: new Date('2024-06-01T00:00:00Z'),
  athleteProfileId: 'profile-1',
  trainingPlanId: 'plan-1',
  title: 'Easy Run',
  sport: 'Running',
  workoutType: 'Endurance',
  scheduledDate: new Date('2024-06-10T00:00:00Z'),
  scheduledStartTime: null,
  plannedDurationSeconds: 3600,
  plannedDistanceMeters: 10000,
  intensity: 'Easy',
  status: 'Planned',
  objective: 'Build base fitness',
  description: null,
  coachNotes: null,
  source: 'Manual',
  aiCoachOutputId: null,
};

const baseStep: WorkoutStep = {
  id: 'step-1',
  plannedWorkoutId: 'wo-1',
  stepIndex: 0,
  stepType: 'Warmup',
  title: 'Easy warm-up',
  instruction: '10 min easy jog',
  durationSeconds: 600,
  distanceMeters: null,
  repetitions: null,
  targetPowerLowerWatts: null,
  targetPowerUpperWatts: null,
  targetHeartRateZoneId: null,
  targetPowerZoneId: null,
  targetPaceZoneId: null,
  targetPaceLowerSecPerKm: null,
  targetPaceUpperSecPerKm: null,
  targetSwimPaceLowerSecPer100m: null,
  targetSwimPaceUpperSecPer100m: null,
  restSeconds: null,
  notes: null,
};

describe('mapWorkoutStep', () => {
  it('maps required fields', () => {
    const dto = mapWorkoutStep(baseStep);
    expect(dto.id).toBe('step-1');
    expect(dto.stepIndex).toBe(0);
    expect(dto.instruction).toBe('10 min easy jog');
  });

  it('maps WorkoutStepType enum values', () => {
    const types = [
      ['Warmup', 'warmup'],
      ['Main', 'main'],
      ['Interval', 'interval'],
      ['Recovery', 'recovery'],
      ['Cooldown', 'cooldown'],
      ['Technique', 'technique'],
      ['StrengthExercise', 'strength_exercise'],
      ['Rest', 'rest'],
      ['Other', 'other'],
    ] as const;
    for (const [prisma, dto] of types) {
      expect(mapWorkoutStep({ ...baseStep, stepType: prisma }).stepType).toBe(dto);
    }
  });

  it('includes target pace range when present', () => {
    const dto = mapWorkoutStep({
      ...baseStep,
      targetPaceLowerSecPerKm: 300,
      targetPaceUpperSecPerKm: 330,
    });
    expect(dto.targetPaceLowerSecPerKm).toBe(300);
    expect(dto.targetPaceUpperSecPerKm).toBe(330);
  });

  it('includes swim pace targets when present', () => {
    const dto = mapWorkoutStep({
      ...baseStep,
      targetSwimPaceLowerSecPer100m: 95,
      targetSwimPaceUpperSecPer100m: 105,
    });
    expect(dto.targetSwimPaceLowerSecPer100m).toBe(95);
    expect(dto.targetSwimPaceUpperSecPer100m).toBe(105);
  });

  it('omits absent optional fields', () => {
    const dto = mapWorkoutStep({ ...baseStep, title: null, durationSeconds: null, notes: null });
    expect('title' in dto).toBe(false);
    expect('durationSeconds' in dto).toBe(false);
    expect('notes' in dto).toBe(false);
  });
});

const baseLink: CompletedWorkoutLink = {
  id: 'link-1',
  linkedAt: new Date('2024-06-10T10:00:00Z'),
  matchConfidence: null,
  plannedWorkoutId: 'wo-1',
  activityId: 'act-1',
};

describe('mapPlannedWorkout', () => {
  const workoutWithSteps: WorkoutWithSteps = {
    ...baseWorkout,
    steps: [baseStep],
    completedWorkoutLink: null,
  };

  it('maps required fields', () => {
    const dto = mapPlannedWorkout(workoutWithSteps);
    expect(dto.id).toBe('wo-1');
    expect(dto.title).toBe('Easy Run');
    expect(dto.trainingPlanId).toBe('plan-1');
    expect(dto.activityId).toBeNull();
  });

  it('maps linked activity id when present', () => {
    const dto = mapPlannedWorkout({ ...workoutWithSteps, completedWorkoutLink: baseLink });
    expect(dto.activityId).toBe('act-1');
  });

  it('formats scheduledDate as YYYY-MM-DD', () => {
    const dto = mapPlannedWorkout(workoutWithSteps);
    expect(dto.scheduledDate).toBe('2024-06-10');
  });

  it('maps enum values to DTO values', () => {
    const dto = mapPlannedWorkout(workoutWithSteps);
    expect(dto.sport).toBe('running');
    expect(dto.workoutType).toBe('endurance');
    expect(dto.intensity).toBe('easy');
    expect(dto.status).toBe('planned');
    expect(dto.source).toBe('manual');
  });

  it('maps WorkoutType enum including compound values', () => {
    expect(mapPlannedWorkout({ ...workoutWithSteps, workoutType: 'RaceSpecific' }).workoutType).toBe('race_specific');
    expect(mapPlannedWorkout({ ...workoutWithSteps, workoutType: 'Vo2Max' }).workoutType).toBe('vo2max');
  });

  it('maps WorkoutIntensity enum values', () => {
    expect(mapPlannedWorkout({ ...workoutWithSteps, intensity: 'Vo2Max' }).intensity).toBe('vo2max');
    expect(mapPlannedWorkout({ ...workoutWithSteps, intensity: 'Moderate' }).intensity).toBe('moderate');
  });

  it('maps WorkoutStatus enum values', () => {
    expect(mapPlannedWorkout({ ...workoutWithSteps, status: 'Completed' }).status).toBe('completed');
    expect(mapPlannedWorkout({ ...workoutWithSteps, status: 'Missed' }).status).toBe('missed');
  });

  it('preserves step order as provided (Prisma guarantees orderBy stepIndex asc)', () => {
    const steps: WorkoutStep[] = [
      { ...baseStep, id: 'step-1', stepIndex: 0, stepType: 'Warmup', instruction: 'Warm up' },
      { ...baseStep, id: 'step-2', stepIndex: 1, stepType: 'Main', instruction: 'Main set' },
      { ...baseStep, id: 'step-3', stepIndex: 2, stepType: 'Cooldown', instruction: 'Cool down' },
    ];
    const dto = mapPlannedWorkout({ ...workoutWithSteps, steps });
    expect(dto.steps[0].stepType).toBe('warmup');
    expect(dto.steps[1].stepType).toBe('main');
    expect(dto.steps[2].stepType).toBe('cooldown');
  });

  it('omits absent optional fields', () => {
    const dto = mapPlannedWorkout({
      ...workoutWithSteps,
      trainingPlanId: null,
      scheduledStartTime: null,
      plannedDurationSeconds: null,
      plannedDistanceMeters: null,
      objective: null,
      description: null,
      coachNotes: null,
    });
    expect('trainingPlanId' in dto).toBe(false);
    expect('scheduledStartTime' in dto).toBe(false);
    expect('plannedDurationSeconds' in dto).toBe(false);
    expect('objective' in dto).toBe(false);
  });
});

describe('mapTrainingPlan', () => {
  const planWithWorkouts: TrainingPlanWithWorkouts = {
    ...basePlan,
    plannedWorkouts: [{ ...baseWorkout, steps: [baseStep], completedWorkoutLink: null }],
  };

  it('maps required fields', () => {
    const dto = mapTrainingPlan(planWithWorkouts);
    expect(dto.id).toBe('plan-1');
    expect(dto.title).toBe('Base Phase');
    expect(dto.description).toBe('Build aerobic base');
    expect(dto.goalId).toBe('goal-1');
  });

  it('formats dates as YYYY-MM-DD', () => {
    const dto = mapTrainingPlan(planWithWorkouts);
    expect(dto.startDate).toBe('2024-06-03');
    expect(dto.endDate).toBe('2024-08-25');
  });

  it('maps TrainingPlanStatus enum values', () => {
    expect(mapTrainingPlan({ ...planWithWorkouts, status: 'Active' }).status).toBe('active');
    expect(mapTrainingPlan({ ...planWithWorkouts, status: 'Draft' }).status).toBe('draft');
    expect(mapTrainingPlan({ ...planWithWorkouts, status: 'Completed' }).status).toBe('completed');
    expect(mapTrainingPlan({ ...planWithWorkouts, status: 'Archived' }).status).toBe('archived');
  });

  it('maps TrainingPlanSource enum values', () => {
    expect(mapTrainingPlan({ ...planWithWorkouts, source: 'AiGenerated' }).source).toBe('ai_generated');
    expect(mapTrainingPlan({ ...planWithWorkouts, source: 'Template' }).source).toBe('template');
  });

  it('returns empty plannedWorkouts array when no workouts', () => {
    const dto = mapTrainingPlan({ ...planWithWorkouts, plannedWorkouts: [] });
    expect(dto.plannedWorkouts).toEqual([]);
  });

  it('omits absent optional fields', () => {
    const dto = mapTrainingPlan({ ...planWithWorkouts, description: null, goalId: null });
    expect('description' in dto).toBe(false);
    expect('goalId' in dto).toBe(false);
  });
});
