import type {
  ActivityType,
  AiCoachOutputStatus,
  AiCoachOutputType,
  AiOutputValidationStatus,
  DataSourceType,
  GoalPriority,
  ImportedFileType,
  ImportStatus,
  PlannedWorkoutSource,
  SportType,
  SwimStrokeType,
  TrainingGoalType,
  TrainingPlanSource,
  TrainingPlanStatus,
  TrainingZoneType,
  TrainingZoneUnit,
  Weekday,
  WorkoutIntensity,
  WorkoutStatus,
  WorkoutStepType,
  WorkoutType,
} from '@prisma/client';
import type {
  ActivityTypeDto,
  AiCoachOutputStatusDto,
  AiCoachOutputTypeDto,
  AiOutputValidationStatusDto,
  DataSourceTypeDto,
  GoalPriorityDto,
  ImportedFileTypeDto,
  ImportStatusDto,
  PlannedWorkoutSourceDto,
  SportTypeDto,
  SwimStrokeTypeDto,
  TrainingGoalTypeDto,
  TrainingPlanSourceDto,
  TrainingPlanStatusDto,
  TrainingZoneTypeDto,
  TrainingZoneUnitDto,
  WeekdayDto,
  WorkoutIntensityDto,
  WorkoutStatusDto,
  WorkoutStepTypeDto,
  WorkoutTypeDto,
} from '@pp-trainer/shared';

export const SPORT_TYPE_MAP: Record<SportType, SportTypeDto> = {
  Cycling: 'cycling',
  Running: 'running',
  Swimming: 'swimming',
  Strength: 'strength',
  Mobility: 'mobility',
  Other: 'other',
};

export const DTO_TO_PRISMA_SPORT_MAP: Record<SportTypeDto, SportType> = {
  cycling: 'Cycling',
  running: 'Running',
  swimming: 'Swimming',
  strength: 'Strength',
  mobility: 'Mobility',
  other: 'Other',
};

export const ACTIVITY_TYPE_MAP: Record<ActivityType, ActivityTypeDto> = {
  Easy: 'easy',
  Long: 'long',
  Tempo: 'tempo',
  Threshold: 'threshold',
  Vo2Max: 'vo2max',
  Race: 'race',
  Recovery: 'recovery',
  Strength: 'strength',
  Technical: 'technical',
  Other: 'other',
};

export const DATA_SOURCE_TYPE_MAP: Record<DataSourceType, DataSourceTypeDto> = {
  Mock: 'mock',
  ManualFitUpload: 'manual_fit_upload',
  ManualGpxUpload: 'manual_gpx_upload',
  ManualTcxUpload: 'manual_tcx_upload',
  ManualJsonImport: 'manual_json_import',
  ManualCsvImport: 'manual_csv_import',
  GarminOfficial: 'garmin_official',
  GarminUnofficial: 'garmin_unofficial',
  GarminExport: 'garmin_export',
  Strava: 'strava',
  Aggregator: 'aggregator',
};

export const DTO_TO_PRISMA_DATA_SOURCE_TYPE_MAP: Record<DataSourceTypeDto, DataSourceType> = {
  mock: 'Mock',
  manual_fit_upload: 'ManualFitUpload',
  manual_gpx_upload: 'ManualGpxUpload',
  manual_tcx_upload: 'ManualTcxUpload',
  manual_json_import: 'ManualJsonImport',
  manual_csv_import: 'ManualCsvImport',
  garmin_official: 'GarminOfficial',
  garmin_unofficial: 'GarminUnofficial',
  garmin_export: 'GarminExport',
  strava: 'Strava',
  aggregator: 'Aggregator',
};

export const SWIM_STROKE_TYPE_MAP: Record<SwimStrokeType, SwimStrokeTypeDto> = {
  Freestyle: 'freestyle',
  Backstroke: 'backstroke',
  Breaststroke: 'breaststroke',
  Butterfly: 'butterfly',
  Mixed: 'mixed',
  Drill: 'drill',
};

export const DTO_TO_PRISMA_SWIM_STROKE_MAP: Record<SwimStrokeTypeDto, SwimStrokeType> = {
  freestyle: 'Freestyle',
  backstroke: 'Backstroke',
  breaststroke: 'Breaststroke',
  butterfly: 'Butterfly',
  mixed: 'Mixed',
  drill: 'Drill',
};

export const GOAL_PRIORITY_MAP: Record<GoalPriority, GoalPriorityDto> = {
  MainGoal: 'main_goal',
  SecondaryGoal: 'secondary_goal',
  Watchlist: 'watchlist',
};

export const TRAINING_GOAL_TYPE_MAP: Record<TrainingGoalType, TrainingGoalTypeDto> = {
  Race: 'race',
  Performance: 'performance',
  Volume: 'volume',
  Fitness: 'fitness',
  General: 'general',
};

export const WEEKDAY_MAP: Record<Weekday, WeekdayDto> = {
  Monday: 'monday',
  Tuesday: 'tuesday',
  Wednesday: 'wednesday',
  Thursday: 'thursday',
  Friday: 'friday',
  Saturday: 'saturday',
  Sunday: 'sunday',
};

export const ZONE_TYPE_MAP: Record<TrainingZoneType, TrainingZoneTypeDto> = {
  HeartRate: 'heart_rate',
  CyclingPower: 'cycling_power',
  RunningPace: 'running_pace',
  SwimmingPace: 'swimming_pace',
  PerceivedEffort: 'perceived_effort',
};

export const ZONE_UNIT_MAP: Record<TrainingZoneUnit, TrainingZoneUnitDto> = {
  Bpm: 'bpm',
  Watts: 'watts',
  SecPerKm: 'sec_per_km',
  SecPer100m: 'sec_per_100m',
  Rpe: 'rpe',
};

export const TRAINING_PLAN_STATUS_MAP: Record<TrainingPlanStatus, TrainingPlanStatusDto> = {
  Draft: 'draft',
  Active: 'active',
  Completed: 'completed',
  Archived: 'archived',
};

export const TRAINING_PLAN_SOURCE_MAP: Record<TrainingPlanSource, TrainingPlanSourceDto> = {
  Manual: 'manual',
  AiGenerated: 'ai_generated',
  Template: 'template',
  Imported: 'imported',
};

export const WORKOUT_TYPE_MAP: Record<WorkoutType, WorkoutTypeDto> = {
  Endurance: 'endurance',
  Recovery: 'recovery',
  Tempo: 'tempo',
  Threshold: 'threshold',
  Vo2Max: 'vo2max',
  Long: 'long',
  RaceSpecific: 'race_specific',
  Technique: 'technique',
  Strength: 'strength',
  Mobility: 'mobility',
  Rest: 'rest',
  Other: 'other',
};

export const WORKOUT_INTENSITY_MAP: Record<WorkoutIntensity, WorkoutIntensityDto> = {
  Rest: 'rest',
  Recovery: 'recovery',
  Easy: 'easy',
  Moderate: 'moderate',
  Tempo: 'tempo',
  Threshold: 'threshold',
  Vo2Max: 'vo2max',
  Race: 'race',
  Strength: 'strength',
};

export const WORKOUT_STATUS_MAP: Record<WorkoutStatus, WorkoutStatusDto> = {
  Planned: 'planned',
  Completed: 'completed',
  Missed: 'missed',
  Moved: 'moved',
  Adjusted: 'adjusted',
  Cancelled: 'cancelled',
};

export const PLANNED_WORKOUT_SOURCE_MAP: Record<PlannedWorkoutSource, PlannedWorkoutSourceDto> = {
  Manual: 'manual',
  AiGenerated: 'ai_generated',
  Template: 'template',
  Imported: 'imported',
};

export const WORKOUT_STEP_TYPE_MAP: Record<WorkoutStepType, WorkoutStepTypeDto> = {
  Warmup: 'warmup',
  Main: 'main',
  Interval: 'interval',
  Recovery: 'recovery',
  Cooldown: 'cooldown',
  Technique: 'technique',
  StrengthExercise: 'strength_exercise',
  Rest: 'rest',
  Other: 'other',
};

export const IMPORTED_FILE_TYPE_MAP: Record<ImportedFileType, ImportedFileTypeDto> = {
  Fit: 'fit',
  Gpx: 'gpx',
  Tcx: 'tcx',
  Json: 'json',
  Csv: 'csv',
  Unknown: 'unknown',
};

export const IMPORT_STATUS_MAP: Record<ImportStatus, ImportStatusDto> = {
  Pending: 'pending',
  Processing: 'processing',
  Success: 'success',
  Failed: 'failed',
  Duplicate: 'duplicate',
  PartiallyImported: 'partially_imported',
};

export const DTO_TO_PRISMA_IMPORT_STATUS_MAP: Record<ImportStatusDto, ImportStatus> = {
  pending: 'Pending',
  processing: 'Processing',
  success: 'Success',
  failed: 'Failed',
  duplicate: 'Duplicate',
  partially_imported: 'PartiallyImported',
};

export const DTO_TO_PRISMA_TRAINING_PLAN_STATUS_MAP: Record<TrainingPlanStatusDto, TrainingPlanStatus> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
};

export const DTO_TO_PRISMA_TRAINING_PLAN_SOURCE_MAP: Record<TrainingPlanSourceDto, TrainingPlanSource> = {
  manual: 'Manual',
  ai_generated: 'AiGenerated',
  template: 'Template',
  imported: 'Imported',
};

export const DTO_TO_PRISMA_PLANNED_WORKOUT_SOURCE_MAP: Record<PlannedWorkoutSourceDto, PlannedWorkoutSource> = {
  manual: 'Manual',
  ai_generated: 'AiGenerated',
  template: 'Template',
  imported: 'Imported',
};

export const DTO_TO_PRISMA_WORKOUT_STATUS_MAP: Record<WorkoutStatusDto, WorkoutStatus> = {
  planned: 'Planned',
  completed: 'Completed',
  missed: 'Missed',
  moved: 'Moved',
  adjusted: 'Adjusted',
  cancelled: 'Cancelled',
};

export const DTO_TO_PRISMA_WORKOUT_TYPE_MAP: Record<WorkoutTypeDto, WorkoutType> = {
  endurance: 'Endurance',
  recovery: 'Recovery',
  tempo: 'Tempo',
  threshold: 'Threshold',
  vo2max: 'Vo2Max',
  long: 'Long',
  race_specific: 'RaceSpecific',
  technique: 'Technique',
  strength: 'Strength',
  mobility: 'Mobility',
  rest: 'Rest',
  other: 'Other',
};

export const DTO_TO_PRISMA_WORKOUT_INTENSITY_MAP: Record<WorkoutIntensityDto, WorkoutIntensity> = {
  rest: 'Rest',
  recovery: 'Recovery',
  easy: 'Easy',
  moderate: 'Moderate',
  tempo: 'Tempo',
  threshold: 'Threshold',
  vo2max: 'Vo2Max',
  race: 'Race',
  strength: 'Strength',
};

export const AI_COACH_OUTPUT_TYPE_MAP: Record<AiCoachOutputType, AiCoachOutputTypeDto> = {
  WeekPlan: 'week_plan',
  SingleWorkout: 'single_workout',
  WeekAnalysis: 'week_analysis',
  PlanAdjustment: 'plan_adjustment',
  Recommendation: 'recommendation',
  TextAnswer: 'text_answer',
};

export const AI_COACH_OUTPUT_STATUS_MAP: Record<AiCoachOutputStatus, AiCoachOutputStatusDto> = {
  Draft: 'draft',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Archived: 'archived',
};

export const AI_OUTPUT_VALIDATION_STATUS_MAP: Record<AiOutputValidationStatus, AiOutputValidationStatusDto> = {
  NotValidated: 'not_validated',
  Valid: 'valid',
  Invalid: 'invalid',
  PartiallyValid: 'partially_valid',
};

export const DTO_TO_PRISMA_WORKOUT_STEP_TYPE_MAP: Record<WorkoutStepTypeDto, WorkoutStepType> = {
  warmup: 'Warmup',
  main: 'Main',
  interval: 'Interval',
  recovery: 'Recovery',
  cooldown: 'Cooldown',
  technique: 'Technique',
  strength_exercise: 'StrengthExercise',
  rest: 'Rest',
  other: 'Other',
};

export const DTO_TO_PRISMA_GOAL_PRIORITY_MAP: Record<GoalPriorityDto, GoalPriority> = {
  main_goal: 'MainGoal',
  secondary_goal: 'SecondaryGoal',
  watchlist: 'Watchlist',
};

export const DTO_TO_PRISMA_TRAINING_GOAL_TYPE_MAP: Record<TrainingGoalTypeDto, TrainingGoalType> = {
  race: 'Race',
  performance: 'Performance',
  volume: 'Volume',
  fitness: 'Fitness',
  general: 'General',
};

export const DTO_TO_PRISMA_ZONE_TYPE_MAP: Record<TrainingZoneTypeDto, TrainingZoneType> = {
  heart_rate: 'HeartRate',
  cycling_power: 'CyclingPower',
  running_pace: 'RunningPace',
  swimming_pace: 'SwimmingPace',
  perceived_effort: 'PerceivedEffort',
};

export const DTO_TO_PRISMA_ZONE_UNIT_MAP: Record<TrainingZoneUnitDto, TrainingZoneUnit> = {
  bpm: 'Bpm',
  watts: 'Watts',
  sec_per_km: 'SecPerKm',
  sec_per_100m: 'SecPer100m',
  rpe: 'Rpe',
};
