export type SportType =
  | 'cycling'
  | 'running'
  | 'swimming'
  | 'strength'
  | 'mobility'
  | 'other';

export type ActivityType =
  | 'easy'
  | 'long'
  | 'tempo'
  | 'threshold'
  | 'vo2max'
  | 'race'
  | 'recovery'
  | 'strength'
  | 'technical'
  | 'other';

export type DataSourceType =
  | 'mock'
  | 'manual_fit_upload'
  | 'manual_gpx_upload'
  | 'manual_tcx_upload'
  | 'manual_json_import'
  | 'manual_csv_import'
  | 'garmin_official'
  | 'garmin_unofficial'
  | 'garmin_export'
  | 'strava'
  | 'aggregator';

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type TrainingGoalType =
  | 'race'
  | 'performance'
  | 'volume'
  | 'fitness'
  | 'general';

export type GoalPriority = 'main_goal' | 'secondary_goal' | 'watchlist';

export type TrainingZoneType =
  | 'heart_rate'
  | 'cycling_power'
  | 'running_pace'
  | 'swimming_pace'
  | 'perceived_effort';

export type TrainingZoneUnit =
  | 'bpm'
  | 'watts'
  | 'sec_per_km'
  | 'sec_per_100m'
  | 'rpe';

export type TrainingPlanStatus = 'draft' | 'active' | 'completed' | 'archived';

export type TrainingPlanSource =
  | 'manual'
  | 'ai_generated'
  | 'template'
  | 'imported';

export type WorkoutType =
  | 'endurance'
  | 'recovery'
  | 'tempo'
  | 'threshold'
  | 'vo2max'
  | 'long'
  | 'race_specific'
  | 'technique'
  | 'strength'
  | 'mobility'
  | 'rest'
  | 'other';

export type WorkoutIntensity =
  | 'rest'
  | 'recovery'
  | 'easy'
  | 'moderate'
  | 'tempo'
  | 'threshold'
  | 'vo2max'
  | 'race'
  | 'strength';

export type WorkoutStatus =
  | 'planned'
  | 'completed'
  | 'missed'
  | 'moved'
  | 'adjusted'
  | 'cancelled';

export type PlannedWorkoutSource =
  | 'manual'
  | 'ai_generated'
  | 'template'
  | 'imported';

export type WorkoutStepType =
  | 'warmup'
  | 'main'
  | 'interval'
  | 'recovery'
  | 'cooldown'
  | 'technique'
  | 'strength_exercise'
  | 'rest'
  | 'other';

export type AiCoachOutputType =
  | 'week_plan'
  | 'single_workout'
  | 'week_analysis'
  | 'plan_adjustment'
  | 'recommendation'
  | 'text_answer';

export type AiCoachOutputStatus =
  | 'draft'
  | 'accepted'
  | 'rejected'
  | 'archived';

export type AiOutputValidationStatus =
  | 'not_validated'
  | 'valid'
  | 'invalid'
  | 'partially_valid';

export type TrainingAvailability = {
  weekday: Weekday;
  available: boolean;
  maxDurationMinutes?: number;
  preferredSports?: SportType[];
  notes?: string;
};

export type AthleteProfile = {
  id: string;
  displayName: string;
  birthYear?: number;
  bodyWeightKg?: number;
  heightCm?: number;
  primarySports: SportType[];
  currentFtpWatts?: number;
  maxHeartRateBpm?: number;
  restingHeartRateBpm?: number;
  runningThresholdPaceSecPerKm?: number;
  swimmingThresholdPaceSecPer100m?: number;
  preferredTrainingDays?: TrainingAvailability[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TrainingGoal = {
  id: string;
  athleteProfileId: string;
  title: string;
  goalType: TrainingGoalType;
  targetDate?: string;
  sport?: SportType;
  priority: GoalPriority;
  targetDistanceMeters?: number;
  targetDurationSeconds?: number;
  targetPaceSecPerKm?: number;
  targetPowerWatts?: number;
  targetSwimPaceSecPer100m?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TrainingZoneSet = {
  id: string;
  athleteProfileId: string;
  sport?: SportType;
  zoneType: TrainingZoneType;
  name: string;
  basedOn?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TrainingZone = {
  id: string;
  trainingZoneSetId: string;
  zoneNumber: number;
  name: string;
  lowerBound?: number;
  upperBound?: number;
  unit: TrainingZoneUnit;
  description?: string;
};

export type SwimStrokeType =
  | 'freestyle'
  | 'backstroke'
  | 'breaststroke'
  | 'butterfly'
  | 'mixed'
  | 'drill';

export type ActivityLap = {
  lapNumber: number;
  distanceMeters: number;
  durationSeconds: number;
  averageHeartRateBpm?: number;
  maxHeartRateBpm?: number;
  averagePaceSecPerKm?: number;
  averageSpeedKmh?: number;
  averagePowerWatts?: number;
  averageCadence?: number;
  elevationGainMeters?: number;
};

export type ActivitySwimLap = {
  lapNumber: number;
  distanceMeters: number;
  durationSeconds: number;
  strokeType?: SwimStrokeType;
  strokeCount?: number;
  swolfScore?: number;
  averagePaceSecPer100m?: number;
  averageHeartRateBpm?: number;
};

export type ActivityStrengthSet = {
  id?: string;
  externalSetId?: string;
  setNumber: number;
  exerciseName?: string;
  exerciseCategory?: string;
  muscleGroup?: string;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
  restSeconds?: number;
  notes?: string;
};

export type ActivityStrengthExercise = {
  exerciseName: string;
  exerciseCategory?: string;
  muscleGroup?: string;
  sets: number;
  reps?: number;
  volumeKg?: number;
  bestWeightKg?: number;
};

export type ActivityTimeSeriesSample = {
  offsetSeconds: number;
  heartRateBpm?: number;
  powerWatts?: number;
  paceSecPerKm?: number;
  swimPaceSecPer100m?: number;
  speedKmh?: number;
  cadenceRpm?: number;
  elevationMeters?: number;
};

export type TimeInZone = {
  zoneNumber: number;
  zoneName: string;
  durationSeconds: number;
  percentage: number;
};

export type RacePrediction = {
  sport: SportType;
  distanceLabel: string;
  distanceMeters: number;
  predictedDurationSeconds: number;
  predictedPaceSecPerKm?: number;
  predictedSpeedKmh?: number;
  estimatedAt: string;
};

export type PerformanceSportStats = {
  vo2maxEstimate?: number;
  vo2maxEstimatedAt?: string;
  thresholdHeartRateBpm?: number;
  thresholdHeartRateEstimatedAt?: string;
  thresholdPaceSecPerKm?: number;
  thresholdPaceSecPer100m?: number;
  thresholdPaceEstimatedAt?: string;
  ftpWatts?: number;
  ftpEstimatedAt?: string;
};

export type PerformanceStats = {
  athleteProfileId: string;
  bySport: Partial<Record<SportType, PerformanceSportStats>>;
  racePredictions?: RacePrediction[];
  updatedAt: string;
};

export type Activity = {
  id: string;
  athleteProfileId: string;
  sourceType: DataSourceType;
  externalId?: string;
  importedFileId?: string;
  rawActivityDataId?: string;
  title?: string;
  sport: SportType;
  activityType?: ActivityType;
  startTime: string;
  timezone?: string;
  durationSeconds: number;
  movingDurationSeconds?: number;
  distanceMeters?: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
  averageHeartRateBpm?: number;
  maxHeartRateBpm?: number;
  averagePowerWatts?: number;
  maxPowerWatts?: number;
  normalizedPowerWatts?: number;
  averagePaceSecPerKm?: number;
  bestPaceSecPerKm?: number;
  averageSpeedKmh?: number;
  maxSpeedKmh?: number;
  averageCadence?: number;
  calories?: number;
  perceivedExertion?: number;
  notes?: string;
  laps?: ActivityLap[];
  swimLaps?: ActivitySwimLap[];
  strengthSets?: ActivityStrengthSet[];
  strengthExercises?: ActivityStrengthExercise[];
  totalSets?: number;
  totalReps?: number;
  totalVolumeKg?: number;
  timeSeries?: ActivityTimeSeriesSample[];
  timeInHrZones?: TimeInZone[];
  intensityFactor?: number;
  trainingStressScore?: number;
  poolLengthMeters?: number;
  dominantStrokeType?: SwimStrokeType;
  totalStrokeCount?: number;
  avgSwolfScore?: number;
  createdAt: string;
  updatedAt: string;
};

export type TrainingPlan = {
  id: string;
  athleteProfileId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: TrainingPlanStatus;
  source: TrainingPlanSource;
  goalId?: string;
  aiCoachOutputId?: string;
  createdAt: string;
  updatedAt: string;
};

export type PlannedWorkout = {
  id: string;
  trainingPlanId?: string;
  athleteProfileId: string;
  title: string;
  sport: SportType;
  workoutType: WorkoutType;
  scheduledDate: string;
  scheduledStartTime?: string;
  plannedDurationSeconds?: number;
  plannedDistanceMeters?: number;
  intensity: WorkoutIntensity;
  status: WorkoutStatus;
  objective?: string;
  description?: string;
  coachNotes?: string;
  source: PlannedWorkoutSource;
  aiCoachOutputId?: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutStep = {
  id: string;
  plannedWorkoutId: string;
  stepIndex: number;
  stepType: WorkoutStepType;
  title?: string;
  instruction: string;
  durationSeconds?: number;
  distanceMeters?: number;
  repetitions?: number;
  targetPowerLowerWatts?: number;
  targetPowerUpperWatts?: number;
  targetHeartRateZoneId?: string;
  targetPowerZoneId?: string;
  targetPaceZoneId?: string;
  targetPaceLowerSecPerKm?: number;
  targetPaceUpperSecPerKm?: number;
  targetSwimPaceLowerSecPer100m?: number;
  targetSwimPaceUpperSecPer100m?: number;
  restSeconds?: number;
  notes?: string;
};

export type WeeklySummary = {
  id: string;
  athleteProfileId: string;
  weekStartDate: string;
  weekEndDate: string;
  totalDurationSeconds: number;
  totalDistanceMeters?: number;
  cyclingDurationSeconds?: number;
  runningDurationSeconds?: number;
  swimmingDurationSeconds?: number;
  strengthDurationSeconds?: number;
  activityCount: number;
  plannedDurationSeconds?: number;
  completedPlannedDurationSeconds?: number;
  easyDurationSeconds?: number;
  moderateDurationSeconds?: number;
  hardDurationSeconds?: number;
  createdAt: string;
  updatedAt: string;
};

export type AiCoachPreview = {
  id: string;
  athleteProfileId: string;
  outputType: AiCoachOutputType;
  status: AiCoachOutputStatus;
  summary: string;
  rawText: string;
  validationStatus: AiOutputValidationStatus;
  createdTrainingPlanId?: string;
  createdPlannedWorkoutId?: string;
  createdAt: string;
};

export type DashboardSummary = {
  athleteProfile: AthleteProfile;
  activeGoal?: TrainingGoal;
  currentWeek: WeeklySummary;
  currentTrainingPlan: TrainingPlan;
  recentActivities: Activity[];
  upcomingWorkouts: PlannedWorkout[];
  aiCoachPreview: AiCoachPreview;
};
