import {
  ActivityType,
  AiCoachOutputStatus,
  AiCoachOutputType,
  AiOutputValidationStatus,
  DataSourceType,
  GoalPriority,
  ImportedFileType,
  ImportStatus,
  PlannedWorkoutSource,
  Prisma,
  RawDataFormat,
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

import {
  prototypeActivities,
  prototypeAiCoachPreview,
  prototypeAthleteProfile,
  prototypePerformanceStats,
  prototypePlannedWorkouts,
  prototypeTrainingGoals,
  prototypeTrainingPlan,
  prototypeTrainingZoneSets,
  prototypeTrainingZones,
  prototypeWorkoutSteps,
} from '../../apps/web/src/mock/prototypeData';
import type {
  Activity,
  ActivityLap,
  ActivityStrengthExercise,
  ActivityStrengthSet,
  ActivitySwimLap,
  ActivityTimeSeriesSample,
  AiCoachPreview,
  AiCoachOutputStatus as PrototypeAiCoachOutputStatus,
  AiCoachOutputType as PrototypeAiCoachOutputType,
  AiOutputValidationStatus as PrototypeAiOutputValidationStatus,
  AthleteProfile,
  DataSourceType as PrototypeDataSourceType,
  GoalPriority as PrototypeGoalPriority,
  PerformanceStats,
  PlannedWorkout,
  PlannedWorkoutSource as PrototypePlannedWorkoutSource,
  RacePrediction,
  SportType as PrototypeSportType,
  SwimStrokeType as PrototypeSwimStrokeType,
  TimeInZone,
  TrainingAvailability,
  TrainingGoal,
  TrainingGoalType as PrototypeTrainingGoalType,
  TrainingPlan,
  TrainingPlanSource as PrototypeTrainingPlanSource,
  TrainingPlanStatus as PrototypeTrainingPlanStatus,
  TrainingZone,
  TrainingZoneSet,
  TrainingZoneType as PrototypeTrainingZoneType,
  TrainingZoneUnit as PrototypeTrainingZoneUnit,
  Weekday as PrototypeWeekday,
  WorkoutIntensity as PrototypeWorkoutIntensity,
  WorkoutStatus as PrototypeWorkoutStatus,
  WorkoutStep,
  WorkoutStepType as PrototypeWorkoutStepType,
  WorkoutType as PrototypeWorkoutType,
} from '../../apps/web/src/mock/prototypeData.types';
import {
  assertMappedValue,
  copyJson,
  optionalNumber,
  optionalString,
  toDate,
  toOptionalDate,
} from './mappingUtils';

type SeedImportHistoryRow = {
  source: PrototypeDataSourceType;
  status: 'Queued' | 'Validated' | 'Blocked';
  activities: number;
  timestamp: string;
  note: string;
};

export type SeedPayload = {
  athleteProfiles: Prisma.AthleteProfileCreateManyInput[];
  trainingGoals: Prisma.TrainingGoalCreateManyInput[];
  trainingAvailability: Prisma.TrainingAvailabilityCreateManyInput[];
  trainingZoneSets: Prisma.TrainingZoneSetCreateManyInput[];
  trainingZones: Prisma.TrainingZoneCreateManyInput[];
  activities: Prisma.ActivityCreateManyInput[];
  activityLaps: Prisma.ActivityLapCreateManyInput[];
  activitySwimLaps: Prisma.ActivitySwimLapCreateManyInput[];
  activityMetricSamples: Prisma.ActivityMetricSampleCreateManyInput[];
  activityTimeInZones: Prisma.ActivityTimeInZoneCreateManyInput[];
  activityStrengthSets: Prisma.ActivityStrengthSetCreateManyInput[];
  activityStrengthExercises: Prisma.ActivityStrengthExerciseCreateManyInput[];
  trainingPlans: Prisma.TrainingPlanCreateManyInput[];
  plannedWorkouts: Prisma.PlannedWorkoutCreateManyInput[];
  workoutSteps: Prisma.WorkoutStepCreateManyInput[];
  performanceSportMetrics: Prisma.PerformanceSportMetricCreateManyInput[];
  racePredictions: Prisma.RacePredictionCreateManyInput[];
  importedFiles: Prisma.ImportedFileCreateManyInput[];
  rawActivityData: Prisma.RawActivityDataCreateManyInput[];
  athleteContextSnapshots: Prisma.AthleteContextSnapshotCreateManyInput[];
  aiCoachOutputs: Prisma.AiCoachOutputCreateManyInput[];
};

const defaultImportHistoryRows: SeedImportHistoryRow[] = [
  {
    source: 'garmin_unofficial',
    status: 'Validated',
    activities: 8,
    timestamp: 'Prototype sample',
    note: 'Representative Garmin sync batch with streams, laps and zones.',
  },
  {
    source: 'manual_fit_upload',
    status: 'Queued',
    activities: 1,
    timestamp: 'Future upload',
    note: 'Single FIT activity awaiting parser integration.',
  },
  {
    source: 'manual_json_import',
    status: 'Blocked',
    activities: 0,
    timestamp: 'Dev fixture',
    note: 'Missing activity start time in example JSON payload.',
  },
];

const sportTypeMap: Record<PrototypeSportType, SportType> = {
  cycling: SportType.Cycling,
  running: SportType.Running,
  swimming: SportType.Swimming,
  strength: SportType.Strength,
  mobility: SportType.Mobility,
  other: SportType.Other,
};

const dataSourceTypeMap: Record<PrototypeDataSourceType, DataSourceType> = {
  mock: DataSourceType.Mock,
  manual_fit_upload: DataSourceType.ManualFitUpload,
  manual_gpx_upload: DataSourceType.ManualGpxUpload,
  manual_tcx_upload: DataSourceType.ManualTcxUpload,
  manual_json_import: DataSourceType.ManualJsonImport,
  manual_csv_import: DataSourceType.ManualCsvImport,
  garmin_official: DataSourceType.GarminOfficial,
  garmin_unofficial: DataSourceType.GarminUnofficial,
  garmin_export: DataSourceType.GarminExport,
  strava: DataSourceType.Strava,
  aggregator: DataSourceType.Aggregator,
};

const weekdayMap: Record<PrototypeWeekday, Weekday> = {
  monday: Weekday.Monday,
  tuesday: Weekday.Tuesday,
  wednesday: Weekday.Wednesday,
  thursday: Weekday.Thursday,
  friday: Weekday.Friday,
  saturday: Weekday.Saturday,
  sunday: Weekday.Sunday,
};

const trainingGoalTypeMap: Record<PrototypeTrainingGoalType, TrainingGoalType> =
  {
    race: TrainingGoalType.Race,
    performance: TrainingGoalType.Performance,
    volume: TrainingGoalType.Volume,
    fitness: TrainingGoalType.Fitness,
    general: TrainingGoalType.General,
  };

const goalPriorityMap: Record<PrototypeGoalPriority, GoalPriority> = {
  main_goal: GoalPriority.MainGoal,
  secondary_goal: GoalPriority.SecondaryGoal,
  watchlist: GoalPriority.Watchlist,
};

const trainingZoneTypeMap: Record<PrototypeTrainingZoneType, TrainingZoneType> =
  {
    heart_rate: TrainingZoneType.HeartRate,
    cycling_power: TrainingZoneType.CyclingPower,
    running_pace: TrainingZoneType.RunningPace,
    swimming_pace: TrainingZoneType.SwimmingPace,
    perceived_effort: TrainingZoneType.PerceivedEffort,
  };

const trainingZoneUnitMap: Record<PrototypeTrainingZoneUnit, TrainingZoneUnit> =
  {
    bpm: TrainingZoneUnit.Bpm,
    watts: TrainingZoneUnit.Watts,
    sec_per_km: TrainingZoneUnit.SecPerKm,
    sec_per_100m: TrainingZoneUnit.SecPer100m,
    rpe: TrainingZoneUnit.Rpe,
  };

const activityTypeMap: Record<Activity['activityType'] & string, ActivityType> =
  {
    easy: ActivityType.Easy,
    long: ActivityType.Long,
    tempo: ActivityType.Tempo,
    threshold: ActivityType.Threshold,
    vo2max: ActivityType.Vo2Max,
    race: ActivityType.Race,
    recovery: ActivityType.Recovery,
    strength: ActivityType.Strength,
    technical: ActivityType.Technical,
    other: ActivityType.Other,
  };

const swimStrokeTypeMap: Record<PrototypeSwimStrokeType, SwimStrokeType> = {
  freestyle: SwimStrokeType.Freestyle,
  backstroke: SwimStrokeType.Backstroke,
  breaststroke: SwimStrokeType.Breaststroke,
  butterfly: SwimStrokeType.Butterfly,
  mixed: SwimStrokeType.Mixed,
  drill: SwimStrokeType.Drill,
};

const trainingPlanStatusMap: Record<
  PrototypeTrainingPlanStatus,
  TrainingPlanStatus
> = {
  draft: TrainingPlanStatus.Draft,
  active: TrainingPlanStatus.Active,
  completed: TrainingPlanStatus.Completed,
  archived: TrainingPlanStatus.Archived,
};

const trainingPlanSourceMap: Record<
  PrototypeTrainingPlanSource,
  TrainingPlanSource
> = {
  manual: TrainingPlanSource.Manual,
  ai_generated: TrainingPlanSource.AiGenerated,
  template: TrainingPlanSource.Template,
  imported: TrainingPlanSource.Imported,
};

const workoutTypeMap: Record<PrototypeWorkoutType, WorkoutType> = {
  endurance: WorkoutType.Endurance,
  recovery: WorkoutType.Recovery,
  tempo: WorkoutType.Tempo,
  threshold: WorkoutType.Threshold,
  vo2max: WorkoutType.Vo2Max,
  long: WorkoutType.Long,
  race_specific: WorkoutType.RaceSpecific,
  technique: WorkoutType.Technique,
  strength: WorkoutType.Strength,
  mobility: WorkoutType.Mobility,
  rest: WorkoutType.Rest,
  other: WorkoutType.Other,
};

const workoutIntensityMap: Record<PrototypeWorkoutIntensity, WorkoutIntensity> =
  {
    rest: WorkoutIntensity.Rest,
    recovery: WorkoutIntensity.Recovery,
    easy: WorkoutIntensity.Easy,
    moderate: WorkoutIntensity.Moderate,
    tempo: WorkoutIntensity.Tempo,
    threshold: WorkoutIntensity.Threshold,
    vo2max: WorkoutIntensity.Vo2Max,
    race: WorkoutIntensity.Race,
    strength: WorkoutIntensity.Strength,
  };

const workoutStatusMap: Record<PrototypeWorkoutStatus, WorkoutStatus> = {
  planned: WorkoutStatus.Planned,
  completed: WorkoutStatus.Completed,
  missed: WorkoutStatus.Missed,
  moved: WorkoutStatus.Moved,
  adjusted: WorkoutStatus.Adjusted,
  cancelled: WorkoutStatus.Cancelled,
};

const plannedWorkoutSourceMap: Record<
  PrototypePlannedWorkoutSource,
  PlannedWorkoutSource
> = {
  manual: PlannedWorkoutSource.Manual,
  ai_generated: PlannedWorkoutSource.AiGenerated,
  template: PlannedWorkoutSource.Template,
  imported: PlannedWorkoutSource.Imported,
};

const workoutStepTypeMap: Record<PrototypeWorkoutStepType, WorkoutStepType> = {
  warmup: WorkoutStepType.Warmup,
  main: WorkoutStepType.Main,
  interval: WorkoutStepType.Interval,
  recovery: WorkoutStepType.Recovery,
  cooldown: WorkoutStepType.Cooldown,
  technique: WorkoutStepType.Technique,
  strength_exercise: WorkoutStepType.StrengthExercise,
  rest: WorkoutStepType.Rest,
  other: WorkoutStepType.Other,
};

const aiCoachOutputTypeMap: Record<
  PrototypeAiCoachOutputType,
  AiCoachOutputType
> = {
  week_plan: AiCoachOutputType.WeekPlan,
  single_workout: AiCoachOutputType.SingleWorkout,
  week_analysis: AiCoachOutputType.WeekAnalysis,
  plan_adjustment: AiCoachOutputType.PlanAdjustment,
  recommendation: AiCoachOutputType.Recommendation,
  text_answer: AiCoachOutputType.TextAnswer,
};

const aiCoachOutputStatusMap: Record<
  PrototypeAiCoachOutputStatus,
  AiCoachOutputStatus
> = {
  draft: AiCoachOutputStatus.Draft,
  accepted: AiCoachOutputStatus.Accepted,
  rejected: AiCoachOutputStatus.Rejected,
  archived: AiCoachOutputStatus.Archived,
};

const aiOutputValidationStatusMap: Record<
  PrototypeAiOutputValidationStatus,
  AiOutputValidationStatus
> = {
  not_validated: AiOutputValidationStatus.NotValidated,
  valid: AiOutputValidationStatus.Valid,
  invalid: AiOutputValidationStatus.Invalid,
  partially_valid: AiOutputValidationStatus.PartiallyValid,
};

function mapSportType(value: PrototypeSportType) {
  return assertMappedValue('sport type', value, sportTypeMap);
}

function mapDataSourceType(value: PrototypeDataSourceType) {
  return assertMappedValue('data source type', value, dataSourceTypeMap);
}

function mapWeekday(value: PrototypeWeekday) {
  return assertMappedValue('weekday', value, weekdayMap);
}

function mapTrainingGoalType(value: PrototypeTrainingGoalType) {
  return assertMappedValue('training goal type', value, trainingGoalTypeMap);
}

function mapGoalPriority(value: PrototypeGoalPriority) {
  return assertMappedValue('goal priority', value, goalPriorityMap);
}

function mapTrainingZoneType(value: PrototypeTrainingZoneType) {
  return assertMappedValue('training zone type', value, trainingZoneTypeMap);
}

function mapTrainingZoneUnit(value: PrototypeTrainingZoneUnit) {
  return assertMappedValue('training zone unit', value, trainingZoneUnitMap);
}

function mapActivityType(value: Activity['activityType']) {
  return value
    ? assertMappedValue('activity type', value, activityTypeMap)
    : undefined;
}

function mapSwimStrokeType(value: PrototypeSwimStrokeType | undefined) {
  return value
    ? assertMappedValue('swim stroke type', value, swimStrokeTypeMap)
    : undefined;
}

function mapTrainingPlanStatus(value: PrototypeTrainingPlanStatus) {
  return assertMappedValue(
    'training plan status',
    value,
    trainingPlanStatusMap,
  );
}

function mapTrainingPlanSource(value: PrototypeTrainingPlanSource) {
  return assertMappedValue(
    'training plan source',
    value,
    trainingPlanSourceMap,
  );
}

function mapWorkoutType(value: PrototypeWorkoutType) {
  return assertMappedValue('workout type', value, workoutTypeMap);
}

function mapWorkoutIntensity(value: PrototypeWorkoutIntensity) {
  return assertMappedValue('workout intensity', value, workoutIntensityMap);
}

function mapWorkoutStatus(value: PrototypeWorkoutStatus) {
  return assertMappedValue('workout status', value, workoutStatusMap);
}

function mapPlannedWorkoutSource(value: PrototypePlannedWorkoutSource) {
  return assertMappedValue(
    'planned workout source',
    value,
    plannedWorkoutSourceMap,
  );
}

function mapWorkoutStepType(value: PrototypeWorkoutStepType) {
  return assertMappedValue('workout step type', value, workoutStepTypeMap);
}

function mapAiCoachOutputType(value: PrototypeAiCoachOutputType) {
  return assertMappedValue('AI coach output type', value, aiCoachOutputTypeMap);
}

function mapAiCoachOutputStatus(value: PrototypeAiCoachOutputStatus) {
  return assertMappedValue(
    'AI coach output status',
    value,
    aiCoachOutputStatusMap,
  );
}

function mapAiOutputValidationStatus(value: PrototypeAiOutputValidationStatus) {
  return assertMappedValue(
    'AI output validation status',
    value,
    aiOutputValidationStatusMap,
  );
}

function mapImportStatus(value: SeedImportHistoryRow['status']) {
  if (value === 'Queued') {
    return ImportStatus.Pending;
  }

  if (value === 'Validated') {
    return ImportStatus.Success;
  }

  return ImportStatus.Failed;
}

function mapImportedFileType(value: PrototypeDataSourceType) {
  if (value === 'manual_fit_upload') {
    return ImportedFileType.Fit;
  }

  if (value === 'manual_gpx_upload') {
    return ImportedFileType.Gpx;
  }

  if (value === 'manual_tcx_upload') {
    return ImportedFileType.Tcx;
  }

  if (value === 'manual_csv_import') {
    return ImportedFileType.Csv;
  }

  return ImportedFileType.Json;
}

function mapRawDataFormat(value: PrototypeDataSourceType) {
  if (value === 'manual_fit_upload') {
    return RawDataFormat.Fit;
  }

  if (value === 'manual_gpx_upload') {
    return RawDataFormat.Gpx;
  }

  if (value === 'manual_tcx_upload') {
    return RawDataFormat.Tcx;
  }

  if (value === 'manual_csv_import') {
    return RawDataFormat.Csv;
  }

  if (value === 'garmin_official' || value === 'garmin_unofficial') {
    return RawDataFormat.GarminApi;
  }

  if (value === 'strava') {
    return RawDataFormat.StravaApi;
  }

  if (value === 'aggregator') {
    return RawDataFormat.AggregatorApi;
  }

  return RawDataFormat.Json;
}

function mapAthleteProfile(
  athleteProfile: AthleteProfile,
): Prisma.AthleteProfileCreateManyInput {
  return {
    id: athleteProfile.id,
    createdAt: toDate(athleteProfile.createdAt),
    updatedAt: toDate(athleteProfile.updatedAt),
    displayName: athleteProfile.displayName,
    birthYear: optionalNumber(athleteProfile.birthYear),
    bodyWeightKg: optionalNumber(athleteProfile.bodyWeightKg),
    heightCm: optionalNumber(athleteProfile.heightCm),
    primarySports: athleteProfile.primarySports.map(mapSportType),
    currentFtpWatts: optionalNumber(athleteProfile.currentFtpWatts),
    maxHeartRateBpm: optionalNumber(athleteProfile.maxHeartRateBpm),
    restingHeartRateBpm: optionalNumber(athleteProfile.restingHeartRateBpm),
    runningThresholdPaceSecPerKm: optionalNumber(
      athleteProfile.runningThresholdPaceSecPerKm,
    ),
    swimmingThresholdPaceSecPer100m: optionalNumber(
      athleteProfile.swimmingThresholdPaceSecPer100m,
    ),
    notes: optionalString(athleteProfile.notes),
  };
}

function mapTrainingGoal(
  trainingGoal: TrainingGoal,
): Prisma.TrainingGoalCreateManyInput {
  return {
    id: trainingGoal.id,
    createdAt: toDate(trainingGoal.createdAt),
    updatedAt: toDate(trainingGoal.updatedAt),
    athleteProfileId: trainingGoal.athleteProfileId,
    title: trainingGoal.title,
    goalType: mapTrainingGoalType(trainingGoal.goalType),
    targetDate: toOptionalDate(trainingGoal.targetDate),
    sport: trainingGoal.sport ? mapSportType(trainingGoal.sport) : undefined,
    priority: mapGoalPriority(trainingGoal.priority),
    targetDistanceMeters: optionalNumber(trainingGoal.targetDistanceMeters),
    targetDurationSeconds: optionalNumber(trainingGoal.targetDurationSeconds),
    targetPaceSecPerKm: optionalNumber(trainingGoal.targetPaceSecPerKm),
    targetPowerWatts: optionalNumber(trainingGoal.targetPowerWatts),
    targetSwimPaceSecPer100m: optionalNumber(
      trainingGoal.targetSwimPaceSecPer100m,
    ),
    description: optionalString(trainingGoal.description),
    isActive: trainingGoal.isActive,
  };
}

function mapTrainingAvailability(
  athleteProfile: AthleteProfile,
  availability: TrainingAvailability,
): Prisma.TrainingAvailabilityCreateManyInput {
  return {
    id: `${athleteProfile.id}-availability-${availability.weekday}`,
    createdAt: toDate(athleteProfile.createdAt),
    updatedAt: toDate(athleteProfile.updatedAt),
    athleteProfileId: athleteProfile.id,
    weekday: mapWeekday(availability.weekday),
    available: availability.available,
    maxDurationMinutes: optionalNumber(availability.maxDurationMinutes),
    preferredSports: (availability.preferredSports ?? []).map(mapSportType),
    notes: optionalString(availability.notes),
  };
}

function mapTrainingZoneSet(
  trainingZoneSet: TrainingZoneSet,
): Prisma.TrainingZoneSetCreateManyInput {
  return {
    id: trainingZoneSet.id,
    createdAt: toDate(trainingZoneSet.createdAt),
    updatedAt: toDate(trainingZoneSet.updatedAt),
    athleteProfileId: trainingZoneSet.athleteProfileId,
    sport: trainingZoneSet.sport
      ? mapSportType(trainingZoneSet.sport)
      : undefined,
    zoneType: mapTrainingZoneType(trainingZoneSet.zoneType),
    name: trainingZoneSet.name,
    basedOn: optionalString(trainingZoneSet.basedOn),
    isActive: trainingZoneSet.isActive,
  };
}

function mapTrainingZone(
  trainingZone: TrainingZone,
): Prisma.TrainingZoneCreateManyInput {
  return {
    id: trainingZone.id,
    trainingZoneSetId: trainingZone.trainingZoneSetId,
    zoneNumber: trainingZone.zoneNumber,
    name: trainingZone.name,
    lowerBound: optionalNumber(trainingZone.lowerBound),
    upperBound: optionalNumber(trainingZone.upperBound),
    unit: mapTrainingZoneUnit(trainingZone.unit),
    description: optionalString(trainingZone.description),
  };
}

function mapActivity(activity: Activity): Prisma.ActivityCreateManyInput {
  return {
    id: activity.id,
    createdAt: toDate(activity.createdAt),
    updatedAt: toDate(activity.updatedAt),
    athleteProfileId: activity.athleteProfileId,
    sourceType: mapDataSourceType(activity.sourceType),
    externalId: optionalString(activity.externalId),
    importedFileId: optionalString(activity.importedFileId),
    rawActivityDataId: optionalString(activity.rawActivityDataId),
    title: optionalString(activity.title),
    sport: mapSportType(activity.sport),
    activityType: mapActivityType(activity.activityType),
    startTime: toDate(activity.startTime),
    timezone: optionalString(activity.timezone),
    durationSeconds: activity.durationSeconds,
    movingDurationSeconds: optionalNumber(activity.movingDurationSeconds),
    distanceMeters: optionalNumber(activity.distanceMeters),
    elevationGainMeters: optionalNumber(activity.elevationGainMeters),
    elevationLossMeters: optionalNumber(activity.elevationLossMeters),
    averageHeartRateBpm: optionalNumber(activity.averageHeartRateBpm),
    maxHeartRateBpm: optionalNumber(activity.maxHeartRateBpm),
    averagePowerWatts: optionalNumber(activity.averagePowerWatts),
    maxPowerWatts: optionalNumber(activity.maxPowerWatts),
    normalizedPowerWatts: optionalNumber(activity.normalizedPowerWatts),
    intensityFactor: optionalNumber(activity.intensityFactor),
    trainingStressScore: optionalNumber(activity.trainingStressScore),
    averagePaceSecPerKm: optionalNumber(activity.averagePaceSecPerKm),
    bestPaceSecPerKm: optionalNumber(activity.bestPaceSecPerKm),
    averageSpeedKmh: optionalNumber(activity.averageSpeedKmh),
    maxSpeedKmh: optionalNumber(activity.maxSpeedKmh),
    averageCadence: optionalNumber(activity.averageCadence),
    calories: optionalNumber(activity.calories),
    perceivedExertion: optionalNumber(activity.perceivedExertion),
    notes: optionalString(activity.notes),
    totalSets: optionalNumber(activity.totalSets),
    totalReps: optionalNumber(activity.totalReps),
    totalVolumeKg: optionalNumber(activity.totalVolumeKg),
    poolLengthMeters: optionalNumber(activity.poolLengthMeters),
    dominantStrokeType: mapSwimStrokeType(activity.dominantStrokeType),
    totalStrokeCount: optionalNumber(activity.totalStrokeCount),
    averageSwolfScore: optionalNumber(activity.avgSwolfScore),
  };
}

function mapActivityLap(
  activityId: string,
  lap: ActivityLap,
): Prisma.ActivityLapCreateManyInput {
  return {
    activityId,
    lapNumber: lap.lapNumber,
    distanceMeters: lap.distanceMeters,
    durationSeconds: lap.durationSeconds,
    averageHeartRateBpm: optionalNumber(lap.averageHeartRateBpm),
    maxHeartRateBpm: optionalNumber(lap.maxHeartRateBpm),
    averagePaceSecPerKm: optionalNumber(lap.averagePaceSecPerKm),
    averageSpeedKmh: optionalNumber(lap.averageSpeedKmh),
    averagePowerWatts: optionalNumber(lap.averagePowerWatts),
    averageCadence: optionalNumber(lap.averageCadence),
    elevationGainMeters: optionalNumber(lap.elevationGainMeters),
  };
}

function mapActivitySwimLap(
  activityId: string,
  lap: ActivitySwimLap,
): Prisma.ActivitySwimLapCreateManyInput {
  return {
    activityId,
    lapNumber: lap.lapNumber,
    distanceMeters: lap.distanceMeters,
    durationSeconds: lap.durationSeconds,
    strokeType: mapSwimStrokeType(lap.strokeType),
    strokeCount: optionalNumber(lap.strokeCount),
    swolfScore: optionalNumber(lap.swolfScore),
    averagePaceSecPer100m: optionalNumber(lap.averagePaceSecPer100m),
    averageHeartRateBpm: optionalNumber(lap.averageHeartRateBpm),
  };
}

function mapActivityMetricSample(
  activityId: string,
  sample: ActivityTimeSeriesSample,
): Prisma.ActivityMetricSampleCreateManyInput {
  return {
    activityId,
    offsetSeconds: sample.offsetSeconds,
    heartRateBpm: optionalNumber(sample.heartRateBpm),
    powerWatts: optionalNumber(sample.powerWatts),
    paceSecPerKm: optionalNumber(sample.paceSecPerKm),
    swimPaceSecPer100m: optionalNumber(sample.swimPaceSecPer100m),
    speedKmh: optionalNumber(sample.speedKmh),
    cadenceRpm: optionalNumber(sample.cadenceRpm),
    elevationMeters: optionalNumber(sample.elevationMeters),
  };
}

function mapActivityTimeInZone(
  activityId: string,
  timeInZone: TimeInZone,
): Prisma.ActivityTimeInZoneCreateManyInput {
  return {
    activityId,
    zoneNumber: timeInZone.zoneNumber,
    zoneName: timeInZone.zoneName,
    durationSeconds: timeInZone.durationSeconds,
    percentage: timeInZone.percentage,
  };
}

function mapActivityStrengthSet(
  activityId: string,
  set: ActivityStrengthSet,
  index: number,
): Prisma.ActivityStrengthSetCreateManyInput {
  return {
    id: set.id ?? `${activityId}-strength-set-${index + 1}`,
    activityId,
    externalSetId: optionalString(set.externalSetId),
    setNumber: set.setNumber,
    exerciseName: optionalString(set.exerciseName),
    exerciseCategory: optionalString(set.exerciseCategory),
    muscleGroup: optionalString(set.muscleGroup),
    reps: optionalNumber(set.reps),
    weightKg: optionalNumber(set.weightKg),
    durationSeconds: optionalNumber(set.durationSeconds),
    restSeconds: optionalNumber(set.restSeconds),
    notes: optionalString(set.notes),
  };
}

function mapActivityStrengthExercise(
  activityId: string,
  exercise: ActivityStrengthExercise,
): Prisma.ActivityStrengthExerciseCreateManyInput {
  return {
    id: `${activityId}-exercise-${exercise.exerciseName
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')}`,
    activityId,
    exerciseName: exercise.exerciseName,
    exerciseCategory: optionalString(exercise.exerciseCategory),
    muscleGroup: optionalString(exercise.muscleGroup),
    sets: exercise.sets,
    reps: optionalNumber(exercise.reps),
    volumeKg: optionalNumber(exercise.volumeKg),
    bestWeightKg: optionalNumber(exercise.bestWeightKg),
  };
}

function mapTrainingPlan(
  trainingPlan: TrainingPlan,
): Prisma.TrainingPlanCreateManyInput {
  return {
    id: trainingPlan.id,
    createdAt: toDate(trainingPlan.createdAt),
    updatedAt: toDate(trainingPlan.updatedAt),
    athleteProfileId: trainingPlan.athleteProfileId,
    title: trainingPlan.title,
    description: optionalString(trainingPlan.description),
    startDate: toDate(trainingPlan.startDate),
    endDate: toDate(trainingPlan.endDate),
    status: mapTrainingPlanStatus(trainingPlan.status),
    source: mapTrainingPlanSource(trainingPlan.source),
    goalId: optionalString(trainingPlan.goalId),
    aiCoachOutputId: optionalString(trainingPlan.aiCoachOutputId),
  };
}

function mapPlannedWorkout(
  plannedWorkout: PlannedWorkout,
): Prisma.PlannedWorkoutCreateManyInput {
  return {
    id: plannedWorkout.id,
    createdAt: toDate(plannedWorkout.createdAt),
    updatedAt: toDate(plannedWorkout.updatedAt),
    athleteProfileId: plannedWorkout.athleteProfileId,
    trainingPlanId: optionalString(plannedWorkout.trainingPlanId),
    title: plannedWorkout.title,
    sport: mapSportType(plannedWorkout.sport),
    workoutType: mapWorkoutType(plannedWorkout.workoutType),
    scheduledDate: toDate(plannedWorkout.scheduledDate),
    scheduledStartTime: toOptionalDate(plannedWorkout.scheduledStartTime),
    plannedDurationSeconds: optionalNumber(
      plannedWorkout.plannedDurationSeconds,
    ),
    plannedDistanceMeters: optionalNumber(plannedWorkout.plannedDistanceMeters),
    intensity: mapWorkoutIntensity(plannedWorkout.intensity),
    status: mapWorkoutStatus(plannedWorkout.status),
    objective: optionalString(plannedWorkout.objective),
    description: optionalString(plannedWorkout.description),
    coachNotes: optionalString(plannedWorkout.coachNotes),
    source: mapPlannedWorkoutSource(plannedWorkout.source),
    aiCoachOutputId: optionalString(plannedWorkout.aiCoachOutputId),
  };
}

function mapWorkoutStep(
  workoutStep: WorkoutStep,
): Prisma.WorkoutStepCreateManyInput {
  return {
    id: workoutStep.id,
    plannedWorkoutId: workoutStep.plannedWorkoutId,
    stepIndex: workoutStep.stepIndex,
    stepType: mapWorkoutStepType(workoutStep.stepType),
    title: optionalString(workoutStep.title),
    instruction: workoutStep.instruction,
    durationSeconds: optionalNumber(workoutStep.durationSeconds),
    distanceMeters: optionalNumber(workoutStep.distanceMeters),
    repetitions: optionalNumber(workoutStep.repetitions),
    targetPowerLowerWatts: optionalNumber(workoutStep.targetPowerLowerWatts),
    targetPowerUpperWatts: optionalNumber(workoutStep.targetPowerUpperWatts),
    targetHeartRateZoneId: optionalString(workoutStep.targetHeartRateZoneId),
    targetPowerZoneId: optionalString(workoutStep.targetPowerZoneId),
    targetPaceZoneId: optionalString(workoutStep.targetPaceZoneId),
    targetPaceLowerSecPerKm: optionalNumber(
      workoutStep.targetPaceLowerSecPerKm,
    ),
    targetPaceUpperSecPerKm: optionalNumber(
      workoutStep.targetPaceUpperSecPerKm,
    ),
    targetSwimPaceLowerSecPer100m: optionalNumber(
      workoutStep.targetSwimPaceLowerSecPer100m,
    ),
    targetSwimPaceUpperSecPer100m: optionalNumber(
      workoutStep.targetSwimPaceUpperSecPer100m,
    ),
    restSeconds: optionalNumber(workoutStep.restSeconds),
    notes: optionalString(workoutStep.notes),
  };
}

function mapPerformanceSportMetric(
  performanceStats: PerformanceStats,
  sport: PrototypeSportType,
): Prisma.PerformanceSportMetricCreateManyInput | undefined {
  const sportStats = performanceStats.bySport[sport];

  if (!sportStats) {
    return undefined;
  }

  return {
    id: `${performanceStats.athleteProfileId}-performance-${sport}`,
    createdAt: toDate(performanceStats.updatedAt),
    updatedAt: toDate(performanceStats.updatedAt),
    athleteProfileId: performanceStats.athleteProfileId,
    sport: mapSportType(sport),
    vo2maxEstimate: optionalNumber(sportStats.vo2maxEstimate),
    vo2maxEstimatedAt: toOptionalDate(sportStats.vo2maxEstimatedAt),
    thresholdHeartRateBpm: optionalNumber(sportStats.thresholdHeartRateBpm),
    thresholdHeartRateEstimatedAt: toOptionalDate(
      sportStats.thresholdHeartRateEstimatedAt,
    ),
    thresholdPaceSecPerKm: optionalNumber(sportStats.thresholdPaceSecPerKm),
    thresholdPaceSecPer100m: optionalNumber(sportStats.thresholdPaceSecPer100m),
    thresholdPaceEstimatedAt: toOptionalDate(
      sportStats.thresholdPaceEstimatedAt,
    ),
    ftpWatts: optionalNumber(sportStats.ftpWatts),
    ftpEstimatedAt: toOptionalDate(sportStats.ftpEstimatedAt),
  };
}

function mapRacePrediction(
  athleteProfileId: string,
  racePrediction: RacePrediction,
): Prisma.RacePredictionCreateManyInput {
  return {
    id: `${athleteProfileId}-race-prediction-${racePrediction.sport}-${racePrediction.distanceMeters}`,
    createdAt: toDate(racePrediction.estimatedAt),
    updatedAt: toDate(racePrediction.estimatedAt),
    athleteProfileId,
    sport: mapSportType(racePrediction.sport),
    distanceLabel: racePrediction.distanceLabel,
    distanceMeters: racePrediction.distanceMeters,
    predictedDurationSeconds: racePrediction.predictedDurationSeconds,
    predictedPaceSecPerKm: optionalNumber(racePrediction.predictedPaceSecPerKm),
    predictedSpeedKmh: optionalNumber(racePrediction.predictedSpeedKmh),
    estimatedAt: toDate(racePrediction.estimatedAt),
  };
}

function mapImportedFile(
  athleteProfileId: string,
  row: SeedImportHistoryRow,
  index: number,
): Prisma.ImportedFileCreateManyInput {
  const fileType = mapImportedFileType(row.source);
  const createdAt = new Date(
    `2026-06-${String(10 + index).padStart(2, '0')}T08:00:00.000Z`,
  );

  return {
    id: `${athleteProfileId}-imported-file-${index + 1}`,
    createdAt,
    updatedAt: createdAt,
    athleteProfileId,
    sourceType: mapDataSourceType(row.source),
    fileName: `prototype-import-${index + 1}.${fileType.toLowerCase()}`,
    fileType,
    fileSizeBytes: row.activities > 0 ? 128000 * row.activities : undefined,
    fileHash: `prototype-import-${index + 1}`,
    importStatus: mapImportStatus(row.status),
    errorMessage: row.status === 'Blocked' ? row.note : undefined,
    uploadedAt: createdAt,
    processedAt: row.status === 'Queued' ? undefined : createdAt,
  };
}

function mapRawActivityData(
  athleteProfileId: string,
  row: SeedImportHistoryRow,
  index: number,
): Prisma.RawActivityDataCreateManyInput {
  const parsedAt =
    row.status === 'Queued'
      ? undefined
      : new Date(
          `2026-06-${String(10 + index).padStart(2, '0')}T08:10:00.000Z`,
        );

  return {
    id: `${athleteProfileId}-raw-activity-data-${index + 1}`,
    createdAt: new Date(
      `2026-06-${String(10 + index).padStart(2, '0')}T08:00:00.000Z`,
    ),
    updatedAt: new Date(
      `2026-06-${String(10 + index).padStart(2, '0')}T08:00:00.000Z`,
    ),
    athleteProfileId,
    sourceType: mapDataSourceType(row.source),
    importedFileId: `${athleteProfileId}-imported-file-${index + 1}`,
    externalId: `prototype-import-${index + 1}`,
    rawFormat: mapRawDataFormat(row.source),
    rawPayload: copyJson({
      source: row.source,
      status: row.status,
      activities: row.activities,
      timestamp: row.timestamp,
      note: row.note,
    }),
    parsedAt,
  };
}

function mapAthleteContextSnapshot(
  athleteProfile: AthleteProfile,
  aiCoachPreview: AiCoachPreview,
): Prisma.AthleteContextSnapshotCreateManyInput {
  return {
    id: `${aiCoachPreview.id}-context`,
    createdAt: toDate(aiCoachPreview.createdAt),
    athleteProfileId: athleteProfile.id,
    contextVersion: 'phase-2-prototype-v1',
    generatedAt: toDate(aiCoachPreview.createdAt),
    goalSummary: 'Phase 2 prototype goal context.',
    recentTrainingSummary: 'Phase 2 prototype training context.',
    availabilitySummary: 'Phase 2 prototype availability context.',
    zoneSummary: 'Phase 2 prototype training zone context.',
    structuredContext: copyJson({
      athleteProfile,
      goals: prototypeTrainingGoals,
      availability: athleteProfile.preferredTrainingDays ?? [],
      performanceStats: prototypePerformanceStats,
    }),
  };
}

function mapAiCoachOutput(
  aiCoachPreview: AiCoachPreview,
): Prisma.AiCoachOutputCreateManyInput {
  return {
    id: aiCoachPreview.id,
    createdAt: toDate(aiCoachPreview.createdAt),
    updatedAt: toDate(aiCoachPreview.createdAt),
    athleteProfileId: aiCoachPreview.athleteProfileId,
    athleteContextSnapshotId: `${aiCoachPreview.id}-context`,
    outputType: mapAiCoachOutputType(aiCoachPreview.outputType),
    status: mapAiCoachOutputStatus(aiCoachPreview.status),
    summary: aiCoachPreview.summary,
    rawText: aiCoachPreview.rawText,
    structuredOutput: copyJson({
      summary: aiCoachPreview.summary,
      createdTrainingPlanId: aiCoachPreview.createdTrainingPlanId,
      createdPlannedWorkoutId: aiCoachPreview.createdPlannedWorkoutId,
    }),
    validationStatus: mapAiOutputValidationStatus(
      aiCoachPreview.validationStatus,
    ),
    validationErrors: [],
    createdTrainingPlanId: optionalString(aiCoachPreview.createdTrainingPlanId),
    createdPlannedWorkoutId: optionalString(
      aiCoachPreview.createdPlannedWorkoutId,
    ),
  };
}

function compact<T>(values: Array<T | undefined>) {
  return values.filter((value): value is T => value !== undefined);
}

function dedupeActivityMetricSamples(
  samples: ActivityTimeSeriesSample[] | undefined,
) {
  const samplesByOffset = new Map<number, ActivityTimeSeriesSample>();

  for (const sample of samples ?? []) {
    samplesByOffset.set(sample.offsetSeconds, sample);
  }

  return [...samplesByOffset.values()].sort(
    (sampleA, sampleB) => sampleA.offsetSeconds - sampleB.offsetSeconds,
  );
}

export function buildDefaultSeedPayload(): SeedPayload {
  const activityLaps = prototypeActivities.flatMap((activity) =>
    (activity.laps ?? []).map((lap) => mapActivityLap(activity.id, lap)),
  );
  const activitySwimLaps = prototypeActivities.flatMap((activity) =>
    (activity.swimLaps ?? []).map((lap) =>
      mapActivitySwimLap(activity.id, lap),
    ),
  );
  const activityMetricSamples = prototypeActivities.flatMap((activity) =>
    dedupeActivityMetricSamples(activity.timeSeries).map((sample) =>
      mapActivityMetricSample(activity.id, sample),
    ),
  );
  const activityTimeInZones = prototypeActivities.flatMap((activity) =>
    (activity.timeInHrZones ?? []).map((timeInZone) =>
      mapActivityTimeInZone(activity.id, timeInZone),
    ),
  );
  const activityStrengthSets = prototypeActivities.flatMap((activity) =>
    (activity.strengthSets ?? []).map((set, index) =>
      mapActivityStrengthSet(activity.id, set, index),
    ),
  );
  const activityStrengthExercises = prototypeActivities.flatMap((activity) =>
    (activity.strengthExercises ?? []).map((exercise) =>
      mapActivityStrengthExercise(activity.id, exercise),
    ),
  );

  return {
    athleteProfiles: [mapAthleteProfile(prototypeAthleteProfile)],
    trainingGoals: prototypeTrainingGoals.map(mapTrainingGoal),
    trainingAvailability: (
      prototypeAthleteProfile.preferredTrainingDays ?? []
    ).map((availability) =>
      mapTrainingAvailability(prototypeAthleteProfile, availability),
    ),
    trainingZoneSets: prototypeTrainingZoneSets.map(mapTrainingZoneSet),
    trainingZones: prototypeTrainingZones.map(mapTrainingZone),
    activities: prototypeActivities.map(mapActivity),
    activityLaps,
    activitySwimLaps,
    activityMetricSamples,
    activityTimeInZones,
    activityStrengthSets,
    activityStrengthExercises,
    trainingPlans: [mapTrainingPlan(prototypeTrainingPlan)],
    plannedWorkouts: prototypePlannedWorkouts.map(mapPlannedWorkout),
    workoutSteps: prototypeWorkoutSteps.map(mapWorkoutStep),
    performanceSportMetrics: compact(
      Object.keys(prototypePerformanceStats.bySport).map((sport) =>
        mapPerformanceSportMetric(
          prototypePerformanceStats,
          sport as PrototypeSportType,
        ),
      ),
    ),
    racePredictions: (prototypePerformanceStats.racePredictions ?? []).map(
      (prediction) =>
        mapRacePrediction(
          prototypePerformanceStats.athleteProfileId,
          prediction,
        ),
    ),
    importedFiles: defaultImportHistoryRows.map((row, index) =>
      mapImportedFile(prototypeAthleteProfile.id, row, index),
    ),
    rawActivityData: defaultImportHistoryRows.map((row, index) =>
      mapRawActivityData(prototypeAthleteProfile.id, row, index),
    ),
    athleteContextSnapshots: [
      mapAthleteContextSnapshot(
        prototypeAthleteProfile,
        prototypeAiCoachPreview,
      ),
    ],
    aiCoachOutputs: [mapAiCoachOutput(prototypeAiCoachPreview)],
  };
}

export function buildNoActivePlanSeedPayload(): SeedPayload {
  const seedPayload = buildDefaultSeedPayload();

  return {
    ...seedPayload,
    trainingPlans: [],
    plannedWorkouts: [],
    workoutSteps: [],
    aiCoachOutputs: seedPayload.aiCoachOutputs.map((aiCoachOutput) => ({
      ...aiCoachOutput,
      structuredOutput: copyJson({
        summary: aiCoachOutput.summary,
        note: 'No active training plan is seeded in this scenario.',
      }),
      createdTrainingPlanId: undefined,
      createdPlannedWorkoutId: undefined,
    })),
  };
}

export function countSeedPayloadRecords(seedPayload: SeedPayload) {
  return Object.values(seedPayload).reduce(
    (total, records) => total + records.length,
    0,
  );
}
