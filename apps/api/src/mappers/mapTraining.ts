import type { TrainingPlan, WorkoutStep } from '@prisma/client';
import type {
  PlannedWorkoutDto,
  TrainingPlanDto,
  TrainingPlanSummaryDto,
  WorkoutStepDto,
} from '@pp-trainer/shared';

import type { TrainingPlanWithWorkouts, WorkoutWithSteps } from '../repositories/TrainingRepository.js';
import {
  PLANNED_WORKOUT_SOURCE_MAP,
  SPORT_TYPE_MAP,
  TRAINING_PLAN_SOURCE_MAP,
  TRAINING_PLAN_STATUS_MAP,
  WORKOUT_INTENSITY_MAP,
  WORKOUT_STATUS_MAP,
  WORKOUT_STEP_TYPE_MAP,
  WORKOUT_TYPE_MAP,
} from './enumMaps.js';

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function mapWorkoutStep(step: WorkoutStep): WorkoutStepDto {
  return {
    id: step.id,
    stepIndex: step.stepIndex,
    stepType: WORKOUT_STEP_TYPE_MAP[step.stepType],
    ...(step.title != null && { title: step.title }),
    instruction: step.instruction,
    ...(step.durationSeconds != null && { durationSeconds: step.durationSeconds }),
    ...(step.distanceMeters != null && { distanceMeters: step.distanceMeters }),
    ...(step.repetitions != null && { repetitions: step.repetitions }),
    ...(step.targetPowerLowerWatts != null && { targetPowerLowerWatts: step.targetPowerLowerWatts }),
    ...(step.targetPowerUpperWatts != null && { targetPowerUpperWatts: step.targetPowerUpperWatts }),
    ...(step.targetHeartRateZoneId != null && { targetHeartRateZoneId: step.targetHeartRateZoneId }),
    ...(step.targetPowerZoneId != null && { targetPowerZoneId: step.targetPowerZoneId }),
    ...(step.targetPaceZoneId != null && { targetPaceZoneId: step.targetPaceZoneId }),
    ...(step.targetPaceLowerSecPerKm != null && { targetPaceLowerSecPerKm: step.targetPaceLowerSecPerKm }),
    ...(step.targetPaceUpperSecPerKm != null && { targetPaceUpperSecPerKm: step.targetPaceUpperSecPerKm }),
    ...(step.targetSwimPaceLowerSecPer100m != null && {
      targetSwimPaceLowerSecPer100m: step.targetSwimPaceLowerSecPer100m,
    }),
    ...(step.targetSwimPaceUpperSecPer100m != null && {
      targetSwimPaceUpperSecPer100m: step.targetSwimPaceUpperSecPer100m,
    }),
    ...(step.restSeconds != null && { restSeconds: step.restSeconds }),
    ...(step.notes != null && { notes: step.notes }),
  };
}

export function mapPlannedWorkout(workout: WorkoutWithSteps): PlannedWorkoutDto {
  return {
    id: workout.id,
    ...(workout.trainingPlanId != null && { trainingPlanId: workout.trainingPlanId }),
    activityId: workout.completedWorkoutLink?.activityId ?? null,
    title: workout.title,
    sport: SPORT_TYPE_MAP[workout.sport],
    workoutType: WORKOUT_TYPE_MAP[workout.workoutType],
    scheduledDate: toDateString(workout.scheduledDate),
    ...(workout.scheduledStartTime != null && {
      scheduledStartTime: workout.scheduledStartTime.toISOString(),
    }),
    ...(workout.plannedDurationSeconds != null && {
      plannedDurationSeconds: workout.plannedDurationSeconds,
    }),
    ...(workout.plannedDistanceMeters != null && {
      plannedDistanceMeters: workout.plannedDistanceMeters,
    }),
    intensity: WORKOUT_INTENSITY_MAP[workout.intensity],
    status: WORKOUT_STATUS_MAP[workout.status],
    ...(workout.objective != null && { objective: workout.objective }),
    ...(workout.description != null && { description: workout.description }),
    ...(workout.coachNotes != null && { coachNotes: workout.coachNotes }),
    source: PLANNED_WORKOUT_SOURCE_MAP[workout.source],
    steps: workout.steps.map(mapWorkoutStep),
  };
}

export function mapTrainingPlanSummary(plan: TrainingPlan): TrainingPlanSummaryDto {
  return {
    id: plan.id,
    title: plan.title,
    ...(plan.description != null && { description: plan.description }),
    startDate: toDateString(plan.startDate),
    endDate: toDateString(plan.endDate),
    status: TRAINING_PLAN_STATUS_MAP[plan.status],
    source: TRAINING_PLAN_SOURCE_MAP[plan.source],
    ...(plan.goalId != null && { goalId: plan.goalId }),
  };
}

export function mapTrainingPlan(plan: TrainingPlanWithWorkouts): TrainingPlanDto {
  return {
    id: plan.id,
    title: plan.title,
    ...(plan.description != null && { description: plan.description }),
    startDate: toDateString(plan.startDate),
    endDate: toDateString(plan.endDate),
    status: TRAINING_PLAN_STATUS_MAP[plan.status],
    source: TRAINING_PLAN_SOURCE_MAP[plan.source],
    ...(plan.goalId != null && { goalId: plan.goalId }),
    plannedWorkouts: plan.plannedWorkouts.map(mapPlannedWorkout),
  };
}
