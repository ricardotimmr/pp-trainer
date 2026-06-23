import type {
  ActivityType,
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
