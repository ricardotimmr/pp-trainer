import type {
  CreateTrainingPlanRequest,
  CurrentTrainingPlanResponseDto,
  PlannedWorkoutDto,
  TrainingPlanDto,
  TrainingPlanSummaryDto,
  UpdateTrainingPlanRequest,
} from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import {
  DTO_TO_PRISMA_TRAINING_PLAN_STATUS_MAP,
} from '../mappers/enumMaps.js';
import { mapPlannedWorkout, mapTrainingPlan, mapTrainingPlanSummary } from '../mappers/mapTraining.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as TrainingRepository from '../repositories/TrainingRepository.js';
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
