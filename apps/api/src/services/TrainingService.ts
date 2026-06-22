import type { CurrentTrainingPlanResponseDto, PlannedWorkoutDto, TrainingPlanDto } from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import { mapPlannedWorkout, mapTrainingPlan } from '../mappers/mapTraining.js';
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
