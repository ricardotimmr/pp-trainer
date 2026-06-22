import { z } from 'zod';

export const SportTypeSchema = z.enum([
  'cycling',
  'running',
  'swimming',
  'strength',
  'mobility',
  'other',
]);

export const ActivityTypeSchema = z.enum([
  'easy',
  'long',
  'tempo',
  'threshold',
  'vo2max',
  'race',
  'recovery',
  'strength',
  'technical',
  'other',
]);

export const DataSourceTypeSchema = z.enum([
  'mock',
  'manual_fit_upload',
  'manual_gpx_upload',
  'manual_tcx_upload',
  'manual_json_import',
  'manual_csv_import',
  'garmin_official',
  'garmin_unofficial',
  'garmin_export',
  'strava',
  'aggregator',
]);

export const WeekdaySchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export const TrainingGoalTypeSchema = z.enum([
  'race',
  'performance',
  'volume',
  'fitness',
  'general',
]);

export const GoalPrioritySchema = z.enum([
  'main_goal',
  'secondary_goal',
  'watchlist',
]);

export const TrainingZoneTypeSchema = z.enum([
  'heart_rate',
  'cycling_power',
  'running_pace',
  'swimming_pace',
  'perceived_effort',
]);

export const TrainingZoneUnitSchema = z.enum([
  'bpm',
  'watts',
  'sec_per_km',
  'sec_per_100m',
  'rpe',
]);

export const TrainingPlanStatusSchema = z.enum([
  'draft',
  'active',
  'completed',
  'archived',
]);

export const TrainingPlanSourceSchema = z.enum([
  'manual',
  'ai_generated',
  'template',
  'imported',
]);

export const WorkoutTypeSchema = z.enum([
  'endurance',
  'recovery',
  'tempo',
  'threshold',
  'vo2max',
  'long',
  'race_specific',
  'technique',
  'strength',
  'mobility',
  'rest',
  'other',
]);

export const WorkoutIntensitySchema = z.enum([
  'rest',
  'recovery',
  'easy',
  'moderate',
  'tempo',
  'threshold',
  'vo2max',
  'race',
  'strength',
]);

export const WorkoutStatusSchema = z.enum([
  'planned',
  'completed',
  'missed',
  'moved',
  'adjusted',
  'cancelled',
]);

export const PlannedWorkoutSourceSchema = z.enum([
  'manual',
  'ai_generated',
  'template',
  'imported',
]);

export const WorkoutStepTypeSchema = z.enum([
  'warmup',
  'main',
  'interval',
  'recovery',
  'cooldown',
  'technique',
  'strength_exercise',
  'rest',
  'other',
]);

export const SwimStrokeTypeSchema = z.enum([
  'freestyle',
  'backstroke',
  'breaststroke',
  'butterfly',
  'mixed',
  'drill',
]);

export const ImportedFileTypeSchema = z.enum([
  'fit',
  'gpx',
  'tcx',
  'json',
  'csv',
  'unknown',
]);

export const ImportStatusSchema = z.enum([
  'pending',
  'processing',
  'success',
  'failed',
  'duplicate',
  'partially_imported',
]);

export const RawDataFormatSchema = z.enum([
  'fit',
  'gpx',
  'tcx',
  'json',
  'csv',
  'garmin_api',
  'strava_api',
  'aggregator_api',
]);

export const AiCoachOutputTypeSchema = z.enum([
  'week_plan',
  'single_workout',
  'week_analysis',
  'plan_adjustment',
  'recommendation',
  'text_answer',
]);

export const AiCoachOutputStatusSchema = z.enum([
  'draft',
  'accepted',
  'rejected',
  'archived',
]);

export const AiOutputValidationStatusSchema = z.enum([
  'not_validated',
  'valid',
  'invalid',
  'partially_valid',
]);

export type SportTypeDto = z.infer<typeof SportTypeSchema>;
export type ActivityTypeDto = z.infer<typeof ActivityTypeSchema>;
export type DataSourceTypeDto = z.infer<typeof DataSourceTypeSchema>;
export type WeekdayDto = z.infer<typeof WeekdaySchema>;
export type TrainingGoalTypeDto = z.infer<typeof TrainingGoalTypeSchema>;
export type GoalPriorityDto = z.infer<typeof GoalPrioritySchema>;
export type TrainingZoneTypeDto = z.infer<typeof TrainingZoneTypeSchema>;
export type TrainingZoneUnitDto = z.infer<typeof TrainingZoneUnitSchema>;
export type TrainingPlanStatusDto = z.infer<typeof TrainingPlanStatusSchema>;
export type TrainingPlanSourceDto = z.infer<typeof TrainingPlanSourceSchema>;
export type WorkoutTypeDto = z.infer<typeof WorkoutTypeSchema>;
export type WorkoutIntensityDto = z.infer<typeof WorkoutIntensitySchema>;
export type WorkoutStatusDto = z.infer<typeof WorkoutStatusSchema>;
export type PlannedWorkoutSourceDto = z.infer<
  typeof PlannedWorkoutSourceSchema
>;
export type WorkoutStepTypeDto = z.infer<typeof WorkoutStepTypeSchema>;
export type SwimStrokeTypeDto = z.infer<typeof SwimStrokeTypeSchema>;
export type ImportedFileTypeDto = z.infer<typeof ImportedFileTypeSchema>;
export type ImportStatusDto = z.infer<typeof ImportStatusSchema>;
export type RawDataFormatDto = z.infer<typeof RawDataFormatSchema>;
export type AiCoachOutputTypeDto = z.infer<typeof AiCoachOutputTypeSchema>;
export type AiCoachOutputStatusDto = z.infer<typeof AiCoachOutputStatusSchema>;
export type AiOutputValidationStatusDto = z.infer<
  typeof AiOutputValidationStatusSchema
>;
