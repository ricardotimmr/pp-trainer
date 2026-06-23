import type {
  PlannedWorkout,
  PlannedWorkoutSource,
  SportType,
  TrainingPlan,
  TrainingPlanSource,
  TrainingPlanStatus,
  WorkoutIntensity,
  WorkoutStatus,
  WorkoutStep,
  WorkoutStepType,
  WorkoutType,
} from '@prisma/client';

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

export type CreateWorkoutStepData = {
  stepIndex: number;
  stepType: WorkoutStepType;
  instruction: string;
  title?: string;
  durationSeconds?: number;
  distanceMeters?: number;
  repetitions?: number;
  targetPowerLowerWatts?: number;
  targetPowerUpperWatts?: number;
  targetPaceLowerSecPerKm?: number;
  targetPaceUpperSecPerKm?: number;
  targetSwimPaceLowerSecPer100m?: number;
  targetSwimPaceUpperSecPer100m?: number;
  targetHeartRateZoneId?: string;
  targetPowerZoneId?: string;
  targetPaceZoneId?: string;
  restSeconds?: number;
  notes?: string;
};

export type CreatePlannedWorkoutInput = {
  athleteProfileId: string;
  trainingPlanId?: string;
  title: string;
  sport: SportType;
  workoutType: WorkoutType;
  scheduledDate: Date;
  scheduledStartTime?: Date;
  plannedDurationSeconds?: number;
  plannedDistanceMeters?: number;
  intensity: WorkoutIntensity;
  status: WorkoutStatus;
  objective?: string;
  description?: string;
  coachNotes?: string;
  source: PlannedWorkoutSource;
  steps: CreateWorkoutStepData[];
};

export type UpdatePlannedWorkoutInput = {
  trainingPlanId?: string;
  title?: string;
  sport?: SportType;
  workoutType?: WorkoutType;
  scheduledDate?: Date;
  scheduledStartTime?: Date;
  plannedDurationSeconds?: number;
  plannedDistanceMeters?: number;
  intensity?: WorkoutIntensity;
  status?: WorkoutStatus;
  objective?: string;
  description?: string;
  coachNotes?: string;
  steps?: CreateWorkoutStepData[];
};

export async function findActivePlanWithWeekWorkouts(
  athleteProfileId: string,
  weekStart: Date,
  weekEnd: Date,
): Promise<TrainingPlanWithWorkouts | null> {
  const plan = await prisma.trainingPlan.findFirst({
    where: { athleteProfileId, status: 'Active' },
  });

  if (!plan) return null;

  // Show all workouts for the week regardless of plan assignment
  const plannedWorkouts = await prisma.plannedWorkout.findMany({
    where: {
      athleteProfileId,
      scheduledDate: { gte: weekStart, lt: weekEnd },
    },
    include: { steps: { orderBy: { stepIndex: 'asc' } } },
    orderBy: { scheduledDate: 'asc' },
  });

  return { ...plan, plannedWorkouts };
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

export async function createPlannedWorkout(
  data: CreatePlannedWorkoutInput,
): Promise<WorkoutWithSteps> {
  const { steps, ...workoutData } = data;
  return prisma.plannedWorkout.create({
    data: {
      ...workoutData,
      steps: { create: steps },
    },
    include: { steps: { orderBy: { stepIndex: 'asc' } } },
  });
}

export async function updatePlannedWorkout(
  id: string,
  data: UpdatePlannedWorkoutInput,
): Promise<WorkoutWithSteps> {
  const { steps, ...workoutFields } = data;
  return prisma.plannedWorkout.update({
    where: { id },
    data: {
      ...workoutFields,
      ...(steps !== undefined && steps.length > 0 && {
        steps: { deleteMany: {}, create: steps },
      }),
    },
    include: { steps: { orderBy: { stepIndex: 'asc' } } },
  });
}

export async function deletePlannedWorkout(id: string): Promise<void> {
  await prisma.plannedWorkout.delete({ where: { id } });
}

export async function listWorkouts(
  athleteProfileId: string,
  from?: Date,
  to?: Date,
): Promise<WorkoutWithSteps[]> {
  return prisma.plannedWorkout.findMany({
    where: {
      athleteProfileId,
      ...(from != null || to != null
        ? { scheduledDate: { ...(from != null && { gte: from }), ...(to != null && { lte: to }) } }
        : {}),
    },
    include: { steps: { orderBy: { stepIndex: 'asc' } } },
    orderBy: { scheduledDate: 'desc' },
  });
}

export async function deleteTrainingPlan(id: string): Promise<void> {
  await prisma.trainingPlan.delete({ where: { id } });
}

export async function deactivateOtherActivePlans(
  athleteProfileId: string,
  excludeId: string,
): Promise<void> {
  await prisma.trainingPlan.updateMany({
    where: { athleteProfileId, status: 'Active', id: { not: excludeId } },
    data: { status: 'Draft' },
  });
}
