-- CreateEnum
CREATE TYPE "SportType" AS ENUM ('cycling', 'running', 'swimming', 'strength', 'mobility', 'other');

-- CreateEnum
CREATE TYPE "DataSourceType" AS ENUM ('mock', 'manual_fit_upload', 'manual_gpx_upload', 'manual_tcx_upload', 'manual_json_import', 'manual_csv_import', 'garmin_official', 'garmin_unofficial', 'garmin_export', 'strava', 'aggregator');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- CreateEnum
CREATE TYPE "TrainingGoalType" AS ENUM ('race', 'performance', 'volume', 'fitness', 'general');

-- CreateEnum
CREATE TYPE "GoalPriority" AS ENUM ('main_goal', 'secondary_goal', 'watchlist');

-- CreateEnum
CREATE TYPE "TrainingZoneType" AS ENUM ('heart_rate', 'cycling_power', 'running_pace', 'swimming_pace', 'perceived_effort');

-- CreateEnum
CREATE TYPE "TrainingZoneUnit" AS ENUM ('bpm', 'watts', 'sec_per_km', 'sec_per_100m', 'rpe');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('easy', 'long', 'tempo', 'threshold', 'vo2max', 'race', 'recovery', 'strength', 'technical', 'other');

-- CreateEnum
CREATE TYPE "SwimStrokeType" AS ENUM ('freestyle', 'backstroke', 'breaststroke', 'butterfly', 'mixed', 'drill');

-- CreateEnum
CREATE TYPE "TrainingPlanStatus" AS ENUM ('draft', 'active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "TrainingPlanSource" AS ENUM ('manual', 'ai_generated', 'template', 'imported');

-- CreateEnum
CREATE TYPE "WorkoutType" AS ENUM ('endurance', 'recovery', 'tempo', 'threshold', 'vo2max', 'long', 'race_specific', 'technique', 'strength', 'mobility', 'rest', 'other');

-- CreateEnum
CREATE TYPE "WorkoutIntensity" AS ENUM ('rest', 'recovery', 'easy', 'moderate', 'tempo', 'threshold', 'vo2max', 'race', 'strength');

-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('planned', 'completed', 'missed', 'moved', 'adjusted', 'cancelled');

-- CreateEnum
CREATE TYPE "PlannedWorkoutSource" AS ENUM ('manual', 'ai_generated', 'template', 'imported');

-- CreateEnum
CREATE TYPE "WorkoutStepType" AS ENUM ('warmup', 'main', 'interval', 'recovery', 'cooldown', 'technique', 'strength_exercise', 'rest', 'other');

-- CreateEnum
CREATE TYPE "ImportedFileType" AS ENUM ('fit', 'gpx', 'tcx', 'json', 'csv', 'unknown');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('pending', 'processing', 'success', 'failed', 'duplicate', 'partially_imported');

-- CreateEnum
CREATE TYPE "RawDataFormat" AS ENUM ('fit', 'gpx', 'tcx', 'json', 'csv', 'garmin_api', 'strava_api', 'aggregator_api');

-- CreateEnum
CREATE TYPE "AiCoachOutputType" AS ENUM ('week_plan', 'single_workout', 'week_analysis', 'plan_adjustment', 'recommendation', 'text_answer');

-- CreateEnum
CREATE TYPE "AiCoachOutputStatus" AS ENUM ('draft', 'accepted', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "AiOutputValidationStatus" AS ENUM ('not_validated', 'valid', 'invalid', 'partially_valid');

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT NOT NULL,
    "birthYear" INTEGER,
    "bodyWeightKg" DECIMAL(5,2),
    "heightCm" INTEGER,
    "primarySports" "SportType"[],
    "currentFtpWatts" INTEGER,
    "maxHeartRateBpm" INTEGER,
    "restingHeartRateBpm" INTEGER,
    "runningThresholdPaceSecPerKm" INTEGER,
    "swimmingThresholdPaceSecPer100m" INTEGER,
    "notes" TEXT,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingGoal" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goalType" "TrainingGoalType" NOT NULL,
    "targetDate" TIMESTAMP(3),
    "sport" "SportType",
    "priority" "GoalPriority" NOT NULL,
    "targetDistanceMeters" INTEGER,
    "targetDurationSeconds" INTEGER,
    "targetPaceSecPerKm" INTEGER,
    "targetPowerWatts" INTEGER,
    "targetSwimPaceSecPer100m" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TrainingGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAvailability" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "maxDurationMinutes" INTEGER,
    "preferredSports" "SportType"[],
    "notes" TEXT,

    CONSTRAINT "TrainingAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingZoneSet" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "sport" "SportType",
    "zoneType" "TrainingZoneType" NOT NULL,
    "name" TEXT NOT NULL,
    "basedOn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TrainingZoneSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingZone" (
    "id" TEXT NOT NULL,
    "trainingZoneSetId" TEXT NOT NULL,
    "zoneNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lowerBound" INTEGER,
    "upperBound" INTEGER,
    "unit" "TrainingZoneUnit" NOT NULL,
    "description" TEXT,

    CONSTRAINT "TrainingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "sourceType" "DataSourceType" NOT NULL,
    "externalId" TEXT,
    "importedFileId" TEXT,
    "rawActivityDataId" TEXT,
    "title" TEXT,
    "sport" "SportType" NOT NULL,
    "activityType" "ActivityType",
    "startTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "durationSeconds" INTEGER NOT NULL,
    "movingDurationSeconds" INTEGER,
    "distanceMeters" INTEGER,
    "elevationGainMeters" INTEGER,
    "elevationLossMeters" INTEGER,
    "averageHeartRateBpm" INTEGER,
    "maxHeartRateBpm" INTEGER,
    "averagePowerWatts" INTEGER,
    "maxPowerWatts" INTEGER,
    "normalizedPowerWatts" INTEGER,
    "intensityFactor" DECIMAL(4,3),
    "trainingStressScore" DECIMAL(6,2),
    "averagePaceSecPerKm" INTEGER,
    "bestPaceSecPerKm" INTEGER,
    "averageSpeedKmh" DECIMAL(6,2),
    "maxSpeedKmh" DECIMAL(6,2),
    "averageCadence" DECIMAL(6,2),
    "calories" INTEGER,
    "perceivedExertion" INTEGER,
    "notes" TEXT,
    "totalSets" INTEGER,
    "totalReps" INTEGER,
    "totalVolumeKg" DECIMAL(9,2),
    "poolLengthMeters" INTEGER,
    "dominantStrokeType" "SwimStrokeType",
    "totalStrokeCount" INTEGER,
    "averageSwolfScore" DECIMAL(5,2),

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLap" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "lapNumber" INTEGER NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "averageHeartRateBpm" INTEGER,
    "maxHeartRateBpm" INTEGER,
    "averagePaceSecPerKm" INTEGER,
    "averageSpeedKmh" DECIMAL(6,2),
    "averagePowerWatts" INTEGER,
    "averageCadence" DECIMAL(6,2),
    "elevationGainMeters" INTEGER,

    CONSTRAINT "ActivityLap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivitySwimLap" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "lapNumber" INTEGER NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "strokeType" "SwimStrokeType",
    "strokeCount" INTEGER,
    "swolfScore" INTEGER,
    "averagePaceSecPer100m" INTEGER,
    "averageHeartRateBpm" INTEGER,

    CONSTRAINT "ActivitySwimLap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityMetricSample" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "offsetSeconds" INTEGER NOT NULL,
    "heartRateBpm" INTEGER,
    "powerWatts" INTEGER,
    "paceSecPerKm" INTEGER,
    "swimPaceSecPer100m" INTEGER,
    "speedKmh" DECIMAL(6,2),
    "cadenceRpm" DECIMAL(6,2),
    "elevationMeters" DECIMAL(7,2),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "ActivityMetricSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityTimeInZone" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "zoneNumber" INTEGER NOT NULL,
    "zoneName" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "ActivityTimeInZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityStrengthSet" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "externalSetId" TEXT,
    "setNumber" INTEGER NOT NULL,
    "exerciseName" TEXT,
    "exerciseCategory" TEXT,
    "muscleGroup" TEXT,
    "reps" INTEGER,
    "weightKg" DECIMAL(7,2),
    "durationSeconds" INTEGER,
    "restSeconds" INTEGER,
    "notes" TEXT,

    CONSTRAINT "ActivityStrengthSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityStrengthExercise" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "exerciseCategory" TEXT,
    "muscleGroup" TEXT,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER,
    "volumeKg" DECIMAL(9,2),
    "bestWeightKg" DECIMAL(7,2),

    CONSTRAINT "ActivityStrengthExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "TrainingPlanStatus" NOT NULL,
    "source" "TrainingPlanSource" NOT NULL,
    "goalId" TEXT,
    "aiCoachOutputId" TEXT,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedWorkout" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "trainingPlanId" TEXT,
    "title" TEXT NOT NULL,
    "sport" "SportType" NOT NULL,
    "workoutType" "WorkoutType" NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledStartTime" TIMESTAMP(3),
    "plannedDurationSeconds" INTEGER,
    "plannedDistanceMeters" INTEGER,
    "intensity" "WorkoutIntensity" NOT NULL,
    "status" "WorkoutStatus" NOT NULL,
    "objective" TEXT,
    "description" TEXT,
    "coachNotes" TEXT,
    "source" "PlannedWorkoutSource" NOT NULL,
    "aiCoachOutputId" TEXT,

    CONSTRAINT "PlannedWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutStep" (
    "id" TEXT NOT NULL,
    "plannedWorkoutId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "stepType" "WorkoutStepType" NOT NULL,
    "title" TEXT,
    "instruction" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "distanceMeters" INTEGER,
    "repetitions" INTEGER,
    "targetPowerLowerWatts" INTEGER,
    "targetPowerUpperWatts" INTEGER,
    "targetHeartRateZoneId" TEXT,
    "targetPowerZoneId" TEXT,
    "targetPaceZoneId" TEXT,
    "targetPaceLowerSecPerKm" INTEGER,
    "targetPaceUpperSecPerKm" INTEGER,
    "targetSwimPaceLowerSecPer100m" INTEGER,
    "targetSwimPaceUpperSecPer100m" INTEGER,
    "restSeconds" INTEGER,
    "notes" TEXT,

    CONSTRAINT "WorkoutStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceSportMetric" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "sport" "SportType" NOT NULL,
    "vo2maxEstimate" DECIMAL(5,2),
    "vo2maxEstimatedAt" TIMESTAMP(3),
    "thresholdHeartRateBpm" INTEGER,
    "thresholdHeartRateEstimatedAt" TIMESTAMP(3),
    "thresholdPaceSecPerKm" INTEGER,
    "thresholdPaceSecPer100m" INTEGER,
    "thresholdPaceEstimatedAt" TIMESTAMP(3),
    "ftpWatts" INTEGER,
    "ftpEstimatedAt" TIMESTAMP(3),

    CONSTRAINT "PerformanceSportMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RacePrediction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "sport" "SportType" NOT NULL,
    "distanceLabel" TEXT NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "predictedDurationSeconds" INTEGER NOT NULL,
    "predictedPaceSecPerKm" INTEGER,
    "predictedSpeedKmh" DECIMAL(6,2),
    "estimatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RacePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportedFile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "sourceType" "DataSourceType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" "ImportedFileType" NOT NULL,
    "fileSizeBytes" INTEGER,
    "fileHash" TEXT,
    "importStatus" "ImportStatus" NOT NULL,
    "errorMessage" TEXT,
    "createdActivityId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "ImportedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawActivityData" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "sourceType" "DataSourceType" NOT NULL,
    "importedFileId" TEXT,
    "externalId" TEXT,
    "rawFormat" "RawDataFormat" NOT NULL,
    "rawPayload" JSONB,
    "rawFilePath" TEXT,
    "parsedAt" TIMESTAMP(3),

    CONSTRAINT "RawActivityData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteContextSnapshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "athleteProfileId" TEXT NOT NULL,
    "contextVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalSummary" TEXT,
    "recentTrainingSummary" TEXT,
    "availabilitySummary" TEXT,
    "zoneSummary" TEXT,
    "recoverySummary" TEXT,
    "structuredContext" JSONB NOT NULL,

    CONSTRAINT "AthleteContextSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCoachOutput" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "athleteContextSnapshotId" TEXT,
    "outputType" "AiCoachOutputType" NOT NULL,
    "status" "AiCoachOutputStatus" NOT NULL,
    "summary" TEXT,
    "rawText" TEXT,
    "structuredOutput" JSONB,
    "validationStatus" "AiOutputValidationStatus" NOT NULL,
    "validationErrors" JSONB,
    "createdTrainingPlanId" TEXT,
    "createdPlannedWorkoutId" TEXT,

    CONSTRAINT "AiCoachOutput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingGoal_athleteProfileId_isActive_priority_idx" ON "TrainingGoal"("athleteProfileId", "isActive", "priority");

-- CreateIndex
CREATE INDEX "TrainingGoal_athleteProfileId_targetDate_idx" ON "TrainingGoal"("athleteProfileId", "targetDate");

-- CreateIndex
CREATE INDEX "TrainingAvailability_athleteProfileId_available_idx" ON "TrainingAvailability"("athleteProfileId", "available");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingAvailability_athleteProfileId_weekday_key" ON "TrainingAvailability"("athleteProfileId", "weekday");

-- CreateIndex
CREATE INDEX "TrainingZoneSet_athleteProfileId_isActive_zoneType_idx" ON "TrainingZoneSet"("athleteProfileId", "isActive", "zoneType");

-- CreateIndex
CREATE INDEX "TrainingZoneSet_athleteProfileId_sport_zoneType_idx" ON "TrainingZoneSet"("athleteProfileId", "sport", "zoneType");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingZone_trainingZoneSetId_zoneNumber_key" ON "TrainingZone"("trainingZoneSetId", "zoneNumber");

-- CreateIndex
CREATE INDEX "Activity_athleteProfileId_startTime_idx" ON "Activity"("athleteProfileId", "startTime");

-- CreateIndex
CREATE INDEX "Activity_athleteProfileId_sport_startTime_durationSeconds_d_idx" ON "Activity"("athleteProfileId", "sport", "startTime", "durationSeconds", "distanceMeters");

-- CreateIndex
CREATE INDEX "Activity_athleteProfileId_sourceType_externalId_idx" ON "Activity"("athleteProfileId", "sourceType", "externalId");

-- CreateIndex
CREATE INDEX "Activity_sport_startTime_idx" ON "Activity"("sport", "startTime");

-- CreateIndex
CREATE INDEX "Activity_sourceType_externalId_idx" ON "Activity"("sourceType", "externalId");

-- CreateIndex
CREATE INDEX "Activity_importedFileId_idx" ON "Activity"("importedFileId");

-- CreateIndex
CREATE INDEX "Activity_rawActivityDataId_idx" ON "Activity"("rawActivityDataId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityLap_activityId_lapNumber_key" ON "ActivityLap"("activityId", "lapNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ActivitySwimLap_activityId_lapNumber_key" ON "ActivitySwimLap"("activityId", "lapNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityMetricSample_activityId_offsetSeconds_key" ON "ActivityMetricSample"("activityId", "offsetSeconds");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityTimeInZone_activityId_zoneNumber_key" ON "ActivityTimeInZone"("activityId", "zoneNumber");

-- CreateIndex
CREATE INDEX "ActivityStrengthSet_activityId_setNumber_idx" ON "ActivityStrengthSet"("activityId", "setNumber");

-- CreateIndex
CREATE INDEX "ActivityStrengthSet_activityId_externalSetId_idx" ON "ActivityStrengthSet"("activityId", "externalSetId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityStrengthExercise_activityId_exerciseName_key" ON "ActivityStrengthExercise"("activityId", "exerciseName");

-- CreateIndex
CREATE INDEX "TrainingPlan_athleteProfileId_startDate_endDate_idx" ON "TrainingPlan"("athleteProfileId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "TrainingPlan_athleteProfileId_status_idx" ON "TrainingPlan"("athleteProfileId", "status");

-- CreateIndex
CREATE INDEX "TrainingPlan_goalId_idx" ON "TrainingPlan"("goalId");

-- CreateIndex
CREATE INDEX "TrainingPlan_aiCoachOutputId_idx" ON "TrainingPlan"("aiCoachOutputId");

-- CreateIndex
CREATE INDEX "PlannedWorkout_athleteProfileId_scheduledDate_idx" ON "PlannedWorkout"("athleteProfileId", "scheduledDate");

-- CreateIndex
CREATE INDEX "PlannedWorkout_athleteProfileId_status_scheduledDate_idx" ON "PlannedWorkout"("athleteProfileId", "status", "scheduledDate");

-- CreateIndex
CREATE INDEX "PlannedWorkout_trainingPlanId_scheduledDate_idx" ON "PlannedWorkout"("trainingPlanId", "scheduledDate");

-- CreateIndex
CREATE INDEX "PlannedWorkout_status_idx" ON "PlannedWorkout"("status");

-- CreateIndex
CREATE INDEX "PlannedWorkout_aiCoachOutputId_idx" ON "PlannedWorkout"("aiCoachOutputId");

-- CreateIndex
CREATE INDEX "WorkoutStep_targetHeartRateZoneId_idx" ON "WorkoutStep"("targetHeartRateZoneId");

-- CreateIndex
CREATE INDEX "WorkoutStep_targetPowerZoneId_idx" ON "WorkoutStep"("targetPowerZoneId");

-- CreateIndex
CREATE INDEX "WorkoutStep_targetPaceZoneId_idx" ON "WorkoutStep"("targetPaceZoneId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutStep_plannedWorkoutId_stepIndex_key" ON "WorkoutStep"("plannedWorkoutId", "stepIndex");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceSportMetric_athleteProfileId_sport_key" ON "PerformanceSportMetric"("athleteProfileId", "sport");

-- CreateIndex
CREATE UNIQUE INDEX "RacePrediction_athleteProfileId_sport_distanceMeters_key" ON "RacePrediction"("athleteProfileId", "sport", "distanceMeters");

-- CreateIndex
CREATE INDEX "ImportedFile_athleteProfileId_uploadedAt_idx" ON "ImportedFile"("athleteProfileId", "uploadedAt");

-- CreateIndex
CREATE INDEX "ImportedFile_sourceType_importStatus_idx" ON "ImportedFile"("sourceType", "importStatus");

-- CreateIndex
CREATE INDEX "ImportedFile_createdActivityId_idx" ON "ImportedFile"("createdActivityId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportedFile_athleteProfileId_fileHash_key" ON "ImportedFile"("athleteProfileId", "fileHash");

-- CreateIndex
CREATE INDEX "RawActivityData_athleteProfileId_createdAt_idx" ON "RawActivityData"("athleteProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "RawActivityData_athleteProfileId_sourceType_externalId_idx" ON "RawActivityData"("athleteProfileId", "sourceType", "externalId");

-- CreateIndex
CREATE INDEX "RawActivityData_sourceType_externalId_idx" ON "RawActivityData"("sourceType", "externalId");

-- CreateIndex
CREATE INDEX "RawActivityData_importedFileId_idx" ON "RawActivityData"("importedFileId");

-- CreateIndex
CREATE INDEX "AthleteContextSnapshot_athleteProfileId_generatedAt_idx" ON "AthleteContextSnapshot"("athleteProfileId", "generatedAt");

-- CreateIndex
CREATE INDEX "AiCoachOutput_athleteProfileId_createdAt_idx" ON "AiCoachOutput"("athleteProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "AiCoachOutput_athleteContextSnapshotId_idx" ON "AiCoachOutput"("athleteContextSnapshotId");

-- CreateIndex
CREATE INDEX "AiCoachOutput_outputType_status_idx" ON "AiCoachOutput"("outputType", "status");

-- CreateIndex
CREATE INDEX "AiCoachOutput_createdTrainingPlanId_idx" ON "AiCoachOutput"("createdTrainingPlanId");

-- CreateIndex
CREATE INDEX "AiCoachOutput_createdPlannedWorkoutId_idx" ON "AiCoachOutput"("createdPlannedWorkoutId");

-- AddForeignKey
ALTER TABLE "TrainingGoal" ADD CONSTRAINT "TrainingGoal_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAvailability" ADD CONSTRAINT "TrainingAvailability_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingZoneSet" ADD CONSTRAINT "TrainingZoneSet_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingZone" ADD CONSTRAINT "TrainingZone_trainingZoneSetId_fkey" FOREIGN KEY ("trainingZoneSetId") REFERENCES "TrainingZoneSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_importedFileId_fkey" FOREIGN KEY ("importedFileId") REFERENCES "ImportedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_rawActivityDataId_fkey" FOREIGN KEY ("rawActivityDataId") REFERENCES "RawActivityData"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLap" ADD CONSTRAINT "ActivityLap_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySwimLap" ADD CONSTRAINT "ActivitySwimLap_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityMetricSample" ADD CONSTRAINT "ActivityMetricSample_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityTimeInZone" ADD CONSTRAINT "ActivityTimeInZone_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityStrengthSet" ADD CONSTRAINT "ActivityStrengthSet_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityStrengthExercise" ADD CONSTRAINT "ActivityStrengthExercise_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "TrainingGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_aiCoachOutputId_fkey" FOREIGN KEY ("aiCoachOutputId") REFERENCES "AiCoachOutput"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedWorkout" ADD CONSTRAINT "PlannedWorkout_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedWorkout" ADD CONSTRAINT "PlannedWorkout_trainingPlanId_fkey" FOREIGN KEY ("trainingPlanId") REFERENCES "TrainingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedWorkout" ADD CONSTRAINT "PlannedWorkout_aiCoachOutputId_fkey" FOREIGN KEY ("aiCoachOutputId") REFERENCES "AiCoachOutput"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutStep" ADD CONSTRAINT "WorkoutStep_plannedWorkoutId_fkey" FOREIGN KEY ("plannedWorkoutId") REFERENCES "PlannedWorkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSportMetric" ADD CONSTRAINT "PerformanceSportMetric_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RacePrediction" ADD CONSTRAINT "RacePrediction_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportedFile" ADD CONSTRAINT "ImportedFile_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportedFile" ADD CONSTRAINT "ImportedFile_createdActivityId_fkey" FOREIGN KEY ("createdActivityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawActivityData" ADD CONSTRAINT "RawActivityData_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawActivityData" ADD CONSTRAINT "RawActivityData_importedFileId_fkey" FOREIGN KEY ("importedFileId") REFERENCES "ImportedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteContextSnapshot" ADD CONSTRAINT "AthleteContextSnapshot_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCoachOutput" ADD CONSTRAINT "AiCoachOutput_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCoachOutput" ADD CONSTRAINT "AiCoachOutput_athleteContextSnapshotId_fkey" FOREIGN KEY ("athleteContextSnapshotId") REFERENCES "AthleteContextSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCoachOutput" ADD CONSTRAINT "AiCoachOutput_createdTrainingPlanId_fkey" FOREIGN KEY ("createdTrainingPlanId") REFERENCES "TrainingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCoachOutput" ADD CONSTRAINT "AiCoachOutput_createdPlannedWorkoutId_fkey" FOREIGN KEY ("createdPlannedWorkoutId") REFERENCES "PlannedWorkout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
