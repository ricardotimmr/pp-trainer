import { z } from 'zod';

import {
  IdSchema,
  IsoDateStringSchema,
  IsoDateTimeStringSchema,
  NonNegativeIntegerSchema,
} from './common.js';
import {
  PlannedWorkoutSourceSchema,
  SportTypeSchema,
  TrainingPlanSourceSchema,
  TrainingPlanStatusSchema,
  WorkoutIntensitySchema,
  WorkoutStatusSchema,
  WorkoutStepTypeSchema,
  WorkoutTypeSchema,
} from './enums.js';

export const WorkoutStepDtoSchema = z.object({
  id: IdSchema,
  stepIndex: NonNegativeIntegerSchema,
  stepType: WorkoutStepTypeSchema,
  title: z.string().optional(),
  instruction: z.string().min(1),
  durationSeconds: NonNegativeIntegerSchema.optional(),
  distanceMeters: NonNegativeIntegerSchema.optional(),
  repetitions: NonNegativeIntegerSchema.optional(),
  targetPowerLowerWatts: NonNegativeIntegerSchema.optional(),
  targetPowerUpperWatts: NonNegativeIntegerSchema.optional(),
  targetHeartRateZoneId: IdSchema.optional(),
  targetPowerZoneId: IdSchema.optional(),
  targetPaceZoneId: IdSchema.optional(),
  targetPaceLowerSecPerKm: NonNegativeIntegerSchema.optional(),
  targetPaceUpperSecPerKm: NonNegativeIntegerSchema.optional(),
  targetSwimPaceLowerSecPer100m: NonNegativeIntegerSchema.optional(),
  targetSwimPaceUpperSecPer100m: NonNegativeIntegerSchema.optional(),
  restSeconds: NonNegativeIntegerSchema.optional(),
  notes: z.string().optional(),
});

export const PlannedWorkoutDtoSchema = z.object({
  id: IdSchema,
  trainingPlanId: IdSchema.optional(),
  title: z.string().min(1),
  sport: SportTypeSchema,
  workoutType: WorkoutTypeSchema,
  scheduledDate: IsoDateStringSchema,
  scheduledStartTime: IsoDateTimeStringSchema.optional(),
  plannedDurationSeconds: NonNegativeIntegerSchema.optional(),
  plannedDistanceMeters: NonNegativeIntegerSchema.optional(),
  intensity: WorkoutIntensitySchema,
  status: WorkoutStatusSchema,
  objective: z.string().optional(),
  description: z.string().optional(),
  coachNotes: z.string().optional(),
  source: PlannedWorkoutSourceSchema,
  steps: z.array(WorkoutStepDtoSchema),
});

export const TrainingPlanDtoSchema = z.object({
  id: IdSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: IsoDateStringSchema,
  endDate: IsoDateStringSchema,
  status: TrainingPlanStatusSchema,
  source: TrainingPlanSourceSchema,
  goalId: IdSchema.optional(),
  plannedWorkouts: z.array(PlannedWorkoutDtoSchema),
});

export const CurrentTrainingPlanResponseDtoSchema = z.object({
  currentTrainingPlan: TrainingPlanDtoSchema.nullable(),
});

export const WorkoutDetailDtoSchema = PlannedWorkoutDtoSchema;

export type WorkoutStepDto = z.infer<typeof WorkoutStepDtoSchema>;
export type PlannedWorkoutDto = z.infer<typeof PlannedWorkoutDtoSchema>;
export type TrainingPlanDto = z.infer<typeof TrainingPlanDtoSchema>;
export type CurrentTrainingPlanResponseDto = z.infer<
  typeof CurrentTrainingPlanResponseDtoSchema
>;
export type WorkoutDetailDto = z.infer<typeof WorkoutDetailDtoSchema>;
