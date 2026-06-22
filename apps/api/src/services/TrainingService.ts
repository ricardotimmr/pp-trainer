import type { CurrentTrainingPlanResponseDto, PlannedWorkoutDto, TrainingPlanDto } from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import { mapPlannedWorkout, mapTrainingPlan } from '../mappers/mapTraining.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as TrainingRepository from '../repositories/TrainingRepository.js';

function getCurrentWeekRange(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const day = now.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const weekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday),
  );
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
  return { weekStart, weekEnd };
}

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
