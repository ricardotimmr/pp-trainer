import type { PlannedWorkout, TrainingPlanSource, TrainingPlanStatus, TrainingPlan, WorkoutStep } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type WorkoutWithSteps = PlannedWorkout & { steps: WorkoutStep[] };
export type TrainingPlanWithWorkouts = TrainingPlan & { plannedWorkouts: WorkoutWithSteps[] };

export type CreateTrainingPlanInput = {
  athleteProfileId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: TrainingPlanStatus;
  source: TrainingPlanSource;
  goalId?: string;
};

export type UpdateTrainingPlanInput = Partial<
  Pick<CreateTrainingPlanInput, 'title' | 'description' | 'startDate' | 'endDate' | 'status' | 'goalId'>
>;

export async function findActivePlanWithWeekWorkouts(
  athleteProfileId: string,
  weekStart: Date,
  weekEnd: Date,
): Promise<TrainingPlanWithWorkouts | null> {
  return prisma.trainingPlan.findFirst({
    where: { athleteProfileId, status: 'Active' },
    include: {
      plannedWorkouts: {
        where: { scheduledDate: { gte: weekStart, lt: weekEnd } },
        include: { steps: { orderBy: { stepIndex: 'asc' } } },
        orderBy: { scheduledDate: 'asc' },
      },
    },
  });
}

export async function findTrainingPlanById(id: string): Promise<TrainingPlanWithWorkouts | null> {
  return prisma.trainingPlan.findUnique({
    where: { id },
    include: {
      plannedWorkouts: {
        include: { steps: { orderBy: { stepIndex: 'asc' } } },
        orderBy: { scheduledDate: 'asc' },
      },
    },
  });
}

export async function findWorkoutById(id: string): Promise<WorkoutWithSteps | null> {
  return prisma.plannedWorkout.findUnique({
    where: { id },
    include: { steps: { orderBy: { stepIndex: 'asc' } } },
  });
}

export async function listTrainingPlans(athleteProfileId: string): Promise<TrainingPlan[]> {
  return prisma.trainingPlan.findMany({
    where: { athleteProfileId },
    orderBy: { startDate: 'desc' },
  });
}

export async function createTrainingPlan(
  data: CreateTrainingPlanInput,
): Promise<TrainingPlanWithWorkouts> {
  return prisma.trainingPlan.create({
    data,
    include: {
      plannedWorkouts: {
        include: { steps: { orderBy: { stepIndex: 'asc' } } },
        orderBy: { scheduledDate: 'asc' },
      },
    },
  });
}

export async function updateTrainingPlan(
  id: string,
  data: UpdateTrainingPlanInput,
): Promise<TrainingPlanWithWorkouts> {
  return prisma.trainingPlan.update({
    where: { id },
    data,
    include: {
      plannedWorkouts: {
        include: { steps: { orderBy: { stepIndex: 'asc' } } },
        orderBy: { scheduledDate: 'asc' },
      },
    },
  });
}
