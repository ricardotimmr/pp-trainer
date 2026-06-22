import { z } from 'zod';

import { IdSchema, IsoDateTimeStringSchema } from './common.js';
import {
  AiCoachOutputStatusSchema,
  AiCoachOutputTypeSchema,
  AiOutputValidationStatusSchema,
} from './enums.js';

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

export const AiCoachOutputDtoSchema = z.object({
  id: IdSchema,
  outputType: AiCoachOutputTypeSchema,
  status: AiCoachOutputStatusSchema,
  summary: z.string().optional(),
  rawText: z.string().optional(),
  validationStatus: AiOutputValidationStatusSchema,
  createdTrainingPlanId: IdSchema.optional(),
  createdPlannedWorkoutId: IdSchema.optional(),
  createdAt: IsoDateTimeStringSchema,
});

export const AiCoachPreviewDtoSchema = z.object({
  athleteContextSnapshot: AthleteContextSnapshotDtoSchema,
  aiCoachOutput: AiCoachOutputDtoSchema,
});

export type AthleteContextSnapshotDto = z.infer<
  typeof AthleteContextSnapshotDtoSchema
>;
export type AiCoachOutputDto = z.infer<typeof AiCoachOutputDtoSchema>;
export type AiCoachPreviewDto = z.infer<typeof AiCoachPreviewDtoSchema>;
