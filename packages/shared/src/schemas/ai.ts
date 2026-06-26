import { z } from 'zod';

import {
  IdSchema,
  IsoDateStringSchema,
  IsoDateTimeStringSchema,
  NonNegativeIntegerSchema,
} from './common.js';
import {
  AiCoachOutputStatusSchema,
  AiCoachOutputTypeSchema,
  AiOutputValidationStatusSchema,
  SportTypeSchema,
  WorkoutIntensitySchema,
  WorkoutStepTypeSchema,
  WorkoutTypeSchema,
} from './enums.js';

// ── Athlete Context Snapshot DTO ─────────────────────────────────────────────

export const AthleteContextSnapshotDtoSchema = z.object({
  id: IdSchema,
  contextVersion: z.string().min(1),
  generatedAt: IsoDateTimeStringSchema,
  goalSummary: z.string().optional(),
  recentTrainingSummary: z.string().optional(),
  availabilitySummary: z.string().optional(),
  zoneSummary: z.string().optional(),
  recoverySummary: z.string().optional(),
});

// ── AI Coach Output DTO ──────────────────────────────────────────────────────

export const AiCoachOutputDtoSchema = z.object({
  id: IdSchema,
  outputType: AiCoachOutputTypeSchema,
  status: AiCoachOutputStatusSchema,
  summary: z.string().optional(),
  rawText: z.string().optional(),
  structuredOutput: z.unknown().optional(),
  validationStatus: AiOutputValidationStatusSchema,
  createdTrainingPlanId: IdSchema.optional(),
  createdPlannedWorkoutId: IdSchema.optional(),
  createdAt: IsoDateTimeStringSchema,
});

export const AiCoachPreviewDtoSchema = z.object({
  athleteContextSnapshot: AthleteContextSnapshotDtoSchema,
  aiCoachOutput: AiCoachOutputDtoSchema,
});

// ── AI Generated Output Schemas ──────────────────────────────────────────────
// Used to validate structured AI responses before storage or acceptance.
// .strict() ensures unexpected fields from AI output are caught early.

export const AiGeneratedWorkoutStepSchema = z
  .object({
    stepIndex: NonNegativeIntegerSchema,
    stepType: WorkoutStepTypeSchema,
    title: z.string().optional(),
    instruction: z.string().min(1),
    durationSeconds: NonNegativeIntegerSchema.optional(),
    distanceMeters: NonNegativeIntegerSchema.optional(),
    repetitions: NonNegativeIntegerSchema.optional(),
    targetPowerLowerWatts: NonNegativeIntegerSchema.optional(),
    targetPowerUpperWatts: NonNegativeIntegerSchema.optional(),
    targetPaceLowerSecPerKm: NonNegativeIntegerSchema.optional(),
    targetPaceUpperSecPerKm: NonNegativeIntegerSchema.optional(),
    targetSwimPaceLowerSecPer100m: NonNegativeIntegerSchema.optional(),
    targetSwimPaceUpperSecPer100m: NonNegativeIntegerSchema.optional(),
    targetHeartRateZoneName: z.string().optional(),
    targetPowerZoneName: z.string().optional(),
    targetPaceZoneName: z.string().optional(),
    restSeconds: NonNegativeIntegerSchema.optional(),
    notes: z.string().optional(),
  })
  .strict();

export const AiGeneratedWorkoutSchema = z
  .object({
    title: z.string().min(1),
    sport: SportTypeSchema,
    workoutType: WorkoutTypeSchema,
    scheduledDate: IsoDateStringSchema.optional(),
    plannedDurationSeconds: NonNegativeIntegerSchema.optional(),
    plannedDistanceMeters: NonNegativeIntegerSchema.optional(),
    intensity: WorkoutIntensitySchema,
    objective: z.string().optional(),
    description: z.string().optional(),
    steps: z.array(AiGeneratedWorkoutStepSchema),
    coachNotes: z.string().optional(),
  })
  .strict()
  .refine((d) => d.objective != null || d.description != null, {
    message: 'At least one of objective or description is required',
    path: ['objective'],
  })
  .refine((d) => d.steps.length >= 1 || d.description != null, {
    message: 'At least one step or a description is required',
    path: ['steps'],
  })
  .refine(
    (d) => {
      const indices = d.steps.map((s) => s.stepIndex);
      return indices.length === new Set(indices).size;
    },
    { message: 'stepIndex values must be unique within a workout', path: ['steps'] },
  );

export const AiGeneratedWeekPlanSchema = z
  .object({
    title: z.string().min(1),
    weekStartDate: IsoDateStringSchema,
    weekEndDate: IsoDateStringSchema,
    focus: z.string().optional(),
    summary: z.string().optional(),
    workouts: z.array(AiGeneratedWorkoutSchema).min(1),
  })
  .strict()
  .refine((d) => d.weekEndDate >= d.weekStartDate, {
    message: 'weekEndDate must be on or after weekStartDate',
    path: ['weekEndDate'],
  });

export const AiGeneratedSingleWorkoutSchema = z
  .object({
    workout: AiGeneratedWorkoutSchema,
  })
  .strict();

// ── AI Coach Request Schemas ─────────────────────────────────────────────────

export const GenerateWeekPlanRequestSchema = z.object({
  weekStartDate: IsoDateStringSchema,
  userInstruction: z.string().optional(),
});

export const GenerateWorkoutRequestSchema = z.object({
  sport: SportTypeSchema,
  intensity: WorkoutIntensitySchema,
  plannedDurationSeconds: NonNegativeIntegerSchema.optional(),
  plannedDistanceMeters: NonNegativeIntegerSchema.optional(),
  scheduledDate: IsoDateStringSchema.optional(),
  userInstruction: z.string().optional(),
});

// ── Training History (Layer 1 long-term memory) ──────────────────────────────

export const AiMonthlyTrainingSummarySchema = z.object({
  month: z.string(),
  totalDurationSeconds: z.number().int().nonnegative(),
  totalDistanceMeters: z.number().int().nonnegative().optional(),
  activityCount: z.number().int().nonnegative(),
  sportBreakdown: z.record(z.string(), z.number().int().nonnegative()),
});

export const AiTrainingHistorySchema = z.object({
  monthlyStats: z.array(AiMonthlyTrainingSummarySchema),
  peakWeekDurationSeconds: z.number().int().nonnegative().optional(),
  totalActivitiesAllTime: z.number().int().nonnegative().optional(),
});

// ── AI Generated Week Analysis ───────────────────────────────────────────────

export const AiGeneratedWeekAnalysisSchema = z
  .object({
    weekStartDate: IsoDateStringSchema,
    weekEndDate: IsoDateStringSchema,
    totalDurationSeconds: NonNegativeIntegerSchema,
    totalDistanceMeters: NonNegativeIntegerSchema.optional(),
    sportBreakdown: z.array(
      z.object({
        sport: z.string(),
        durationSeconds: NonNegativeIntegerSchema,
        distanceMeters: NonNegativeIntegerSchema.optional(),
        activityCount: NonNegativeIntegerSchema,
      }),
    ),
    keyObservations: z.array(z.string()).min(2).max(4),
    suggestedFocus: z.string(),
    coachComment: z.string(),
  })
  .strict();

export const GenerateWeekAnalysisRequestSchema = z.object({
  weekStartDate: IsoDateStringSchema.optional(),
});

export const AcceptAiOutputRequestSchema = z
  .object({
    singleWorkoutOverride: AiGeneratedSingleWorkoutSchema.optional(),
  })
  .strict();

// ── Coaching Memory (Layer 2 long-term memory) ───────────────────────────────

export const AiCoachingMemorySchema = z.object({
  recentEntries: z.array(z.string()),
  olderSummary: z.string().optional(),
});

// ── Types ────────────────────────────────────────────────────────────────────

export type AthleteContextSnapshotDto = z.infer<typeof AthleteContextSnapshotDtoSchema>;
export type AiCoachOutputDto = z.infer<typeof AiCoachOutputDtoSchema>;
export type AiCoachPreviewDto = z.infer<typeof AiCoachPreviewDtoSchema>;
export type AiGeneratedWorkoutStep = z.infer<typeof AiGeneratedWorkoutStepSchema>;
export type AiGeneratedWorkout = z.infer<typeof AiGeneratedWorkoutSchema>;
export type AiGeneratedWeekPlan = z.infer<typeof AiGeneratedWeekPlanSchema>;
export type AiGeneratedSingleWorkout = z.infer<typeof AiGeneratedSingleWorkoutSchema>;
export type GenerateWeekPlanRequest = z.infer<typeof GenerateWeekPlanRequestSchema>;
export type GenerateWorkoutRequest = z.infer<typeof GenerateWorkoutRequestSchema>;
export type AiMonthlyTrainingSummary = z.infer<typeof AiMonthlyTrainingSummarySchema>;
export type AiTrainingHistory = z.infer<typeof AiTrainingHistorySchema>;
export type AiCoachingMemory = z.infer<typeof AiCoachingMemorySchema>;
export type AiGeneratedWeekAnalysis = z.infer<typeof AiGeneratedWeekAnalysisSchema>;
export type GenerateWeekAnalysisRequest = z.infer<typeof GenerateWeekAnalysisRequestSchema>;
export type AcceptAiOutputRequest = z.infer<typeof AcceptAiOutputRequestSchema>;
