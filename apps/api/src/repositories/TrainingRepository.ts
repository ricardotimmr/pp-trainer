import type { PlannedWorkout, TrainingPlan, WorkoutStep } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type WorkoutWithSteps = PlannedWorkout & { steps: WorkoutStep[] };
export type TrainingPlanWithWorkouts = TrainingPlan & { plannedWorkouts: WorkoutWithSteps[] };

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
