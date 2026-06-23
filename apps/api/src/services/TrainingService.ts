import type {
  CreatePlannedWorkoutRequest,
  CreateTrainingPlanRequest,
  CreateWorkoutStepRequest,
  CurrentTrainingPlanResponseDto,
  PlannedWorkoutDto,
  TrainingPlanDto,
  TrainingPlanSummaryDto,
  UpdatePlannedWorkoutRequest,
  UpdateTrainingPlanRequest,
} from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import {
  DTO_TO_PRISMA_SPORT_MAP,
  DTO_TO_PRISMA_TRAINING_PLAN_STATUS_MAP,
  DTO_TO_PRISMA_WORKOUT_INTENSITY_MAP,
  DTO_TO_PRISMA_WORKOUT_STATUS_MAP,
  DTO_TO_PRISMA_WORKOUT_STEP_TYPE_MAP,
  DTO_TO_PRISMA_WORKOUT_TYPE_MAP,
} from '../mappers/enumMaps.js';
import {
  mapPlannedWorkout,
  mapTrainingPlan,
  mapTrainingPlanSummary,
} from '../mappers/mapTraining.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as TrainingRepository from '../repositories/TrainingRepository.js';
import type { CreateWorkoutStepData } from '../repositories/TrainingRepository.js';
import { getCurrentWeekRange } from '../utils/dateUtils.js';

export async function getCurrentWeekPlan(): Promise<CurrentTrainingPlanResponseDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();

  if (!profile) {
    return { currentTrainingPlan: null };
  }

  const { weekStart, weekEnd } = getCurrentWeekRange();
  const plan = await TrainingRepository.findActivePlanWithWeekWorkouts(
    profile.id,
    weekStart,
    weekEnd,
  );

  if (!plan) {
    return { currentTrainingPlan: null };
  }

  return { currentTrainingPlan: mapTrainingPlan(plan) };
}

export async function getTrainingPlanById(id: string): Promise<TrainingPlanDto> {
  const plan = await TrainingRepository.findTrainingPlanById(id);

  if (!plan) {
    throw ApiError.notFound('Training plan not found');
  }

  return mapTrainingPlan(plan);
}

export async function getWorkoutById(id: string): Promise<PlannedWorkoutDto> {
  const workout = await TrainingRepository.findWorkoutById(id);

  if (!workout) {
    throw ApiError.notFound('Workout not found');
  }

  return mapPlannedWorkout(workout);
}

export async function listTrainingPlans(): Promise<TrainingPlanSummaryDto[]> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) return [];
  const plans = await TrainingRepository.listTrainingPlans(profile.id);
  return plans.map(mapTrainingPlanSummary);
}

export async function createTrainingPlan(
  data: CreateTrainingPlanRequest,
): Promise<TrainingPlanDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) throw ApiError.notFound('No athlete profile found');

  const plan = await TrainingRepository.createTrainingPlan({
    athleteProfileId: profile.id,
    title: data.title,
    ...(data.description != null && { description: data.description }),
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    status: DTO_TO_PRISMA_TRAINING_PLAN_STATUS_MAP[data.status],
    source: 'Manual',
    ...(data.goalId != null && { goalId: data.goalId }),
  });

  return mapTrainingPlan(plan);
}

export async function updateTrainingPlan(
  id: string,
  data: UpdateTrainingPlanRequest,
): Promise<TrainingPlanDto> {
  const existing = await TrainingRepository.findTrainingPlanById(id);
  if (!existing) throw ApiError.notFound('Training plan not found');

  const plan = await TrainingRepository.updateTrainingPlan(id, {
    ...(data.title != null && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.startDate != null && { startDate: new Date(data.startDate) }),
    ...(data.endDate != null && { endDate: new Date(data.endDate) }),
    ...(data.status != null && { status: DTO_TO_PRISMA_TRAINING_PLAN_STATUS_MAP[data.status] }),
    ...(data.goalId !== undefined && { goalId: data.goalId }),
  });

  return mapTrainingPlan(plan);
}

function mapStepRequest(step: CreateWorkoutStepRequest): CreateWorkoutStepData {
  return {
    stepIndex: step.stepIndex,
    stepType: DTO_TO_PRISMA_WORKOUT_STEP_TYPE_MAP[step.stepType],
    instruction: step.instruction,
    ...(step.title != null && { title: step.title }),
    ...(step.durationSeconds != null && { durationSeconds: step.durationSeconds }),
    ...(step.distanceMeters != null && { distanceMeters: step.distanceMeters }),
    ...(step.repetitions != null && { repetitions: step.repetitions }),
    ...(step.targetPowerLowerWatts != null && { targetPowerLowerWatts: step.targetPowerLowerWatts }),
    ...(step.targetPowerUpperWatts != null && { targetPowerUpperWatts: step.targetPowerUpperWatts }),
    ...(step.targetPaceLowerSecPerKm != null && { targetPaceLowerSecPerKm: step.targetPaceLowerSecPerKm }),
    ...(step.targetPaceUpperSecPerKm != null && { targetPaceUpperSecPerKm: step.targetPaceUpperSecPerKm }),
    ...(step.targetSwimPaceLowerSecPer100m != null && { targetSwimPaceLowerSecPer100m: step.targetSwimPaceLowerSecPer100m }),
    ...(step.targetSwimPaceUpperSecPer100m != null && { targetSwimPaceUpperSecPer100m: step.targetSwimPaceUpperSecPer100m }),
    ...(step.targetHeartRateZoneId != null && { targetHeartRateZoneId: step.targetHeartRateZoneId }),
    ...(step.targetPowerZoneId != null && { targetPowerZoneId: step.targetPowerZoneId }),
    ...(step.targetPaceZoneId != null && { targetPaceZoneId: step.targetPaceZoneId }),
    ...(step.restSeconds != null && { restSeconds: step.restSeconds }),
    ...(step.notes != null && { notes: step.notes }),
  };
}

function assertUniqueStepIndexes(steps: CreateWorkoutStepRequest[]): void {
  const seen = new Set<number>();
  for (const s of steps) {
    if (seen.has(s.stepIndex)) {
      throw ApiError.badRequest(
        `steps[].stepIndex must be unique — duplicate index: ${s.stepIndex}`,
      );
    }
    seen.add(s.stepIndex);
  }
}

export async function createWorkout(
  data: CreatePlannedWorkoutRequest,
): Promise<PlannedWorkoutDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) throw ApiError.notFound('No athlete profile found');

  if (data.steps.length > 0) assertUniqueStepIndexes(data.steps);

  if (data.trainingPlanId != null) {
    const plan = await TrainingRepository.findTrainingPlanById(data.trainingPlanId);
    if (!plan) throw ApiError.notFound('Training plan not found');
  }

  const workout = await TrainingRepository.createPlannedWorkout({
    athleteProfileId: profile.id,
    ...(data.trainingPlanId != null && { trainingPlanId: data.trainingPlanId }),
    title: data.title,
    sport: DTO_TO_PRISMA_SPORT_MAP[data.sport],
    workoutType: DTO_TO_PRISMA_WORKOUT_TYPE_MAP[data.workoutType],
    scheduledDate: new Date(data.scheduledDate),
    ...(data.scheduledStartTime != null && { scheduledStartTime: new Date(data.scheduledStartTime) }),
    ...(data.plannedDurationSeconds != null && { plannedDurationSeconds: data.plannedDurationSeconds }),
    ...(data.plannedDistanceMeters != null && { plannedDistanceMeters: data.plannedDistanceMeters }),
    intensity: DTO_TO_PRISMA_WORKOUT_INTENSITY_MAP[data.intensity],
    status: DTO_TO_PRISMA_WORKOUT_STATUS_MAP[data.status],
    ...(data.objective != null && { objective: data.objective }),
    ...(data.description != null && { description: data.description }),
    ...(data.coachNotes != null && { coachNotes: data.coachNotes }),
    source: 'Manual',
    steps: data.steps.map(mapStepRequest),
  });

  return mapPlannedWorkout(workout);
}

export async function updateWorkout(
  id: string,
  data: UpdatePlannedWorkoutRequest,
): Promise<PlannedWorkoutDto> {
  const existing = await TrainingRepository.findWorkoutById(id);
  if (!existing) throw ApiError.notFound('Workout not found');

  if (data.steps != null && data.steps.length > 0) assertUniqueStepIndexes(data.steps);

  const workout = await TrainingRepository.updatePlannedWorkout(id, {
    ...(data.title != null && { title: data.title }),
    ...(data.sport != null && { sport: DTO_TO_PRISMA_SPORT_MAP[data.sport] }),
    ...(data.workoutType != null && { workoutType: DTO_TO_PRISMA_WORKOUT_TYPE_MAP[data.workoutType] }),
    ...(data.scheduledDate != null && { scheduledDate: new Date(data.scheduledDate) }),
    ...(data.scheduledStartTime != null && { scheduledStartTime: new Date(data.scheduledStartTime) }),
    ...(data.plannedDurationSeconds !== undefined && { plannedDurationSeconds: data.plannedDurationSeconds }),
    ...(data.plannedDistanceMeters !== undefined && { plannedDistanceMeters: data.plannedDistanceMeters }),
    ...(data.intensity != null && { intensity: DTO_TO_PRISMA_WORKOUT_INTENSITY_MAP[data.intensity] }),
    ...(data.status != null && { status: DTO_TO_PRISMA_WORKOUT_STATUS_MAP[data.status] }),
    ...(data.objective !== undefined && { objective: data.objective }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.coachNotes !== undefined && { coachNotes: data.coachNotes }),
    ...(data.trainingPlanId !== undefined && { trainingPlanId: data.trainingPlanId }),
    ...(data.steps != null && { steps: data.steps.map(mapStepRequest) }),
  });

  return mapPlannedWorkout(workout);
}

export async function deleteWorkout(id: string): Promise<void> {
  const existing = await TrainingRepository.findWorkoutById(id);
  if (!existing) throw ApiError.notFound('Workout not found');
  await TrainingRepository.deletePlannedWorkout(id);
}
