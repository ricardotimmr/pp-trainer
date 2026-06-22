import type {
  ActivityType,
  DataSourceType,
  GoalPriority,
  SportType,
  SwimStrokeType,
  TrainingGoalType,
  TrainingZoneType,
  TrainingZoneUnit,
  Weekday,
} from '@prisma/client';
import type {
  ActivityTypeDto,
  DataSourceTypeDto,
  GoalPriorityDto,
  SportTypeDto,
  SwimStrokeTypeDto,
  TrainingGoalTypeDto,
  TrainingZoneTypeDto,
  TrainingZoneUnitDto,
  WeekdayDto,
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
