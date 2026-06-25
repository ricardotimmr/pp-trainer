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
  prototypeWeeklySummary,
  prototypeWorkoutSteps,
} from './prototypeData';
import type {
  Activity,
  AiCoachPreview,
  AthleteProfile,
  PerformanceStats,
  PlannedWorkout,
  TrainingGoal,
  TrainingPlan,
  TrainingZone,
  TrainingZoneSet,
  WeeklySummary,
  WorkoutStep,
} from './prototypeData.types';

export type PrototypeFixtureKey =
  | 'default'
  | 'dashboard_empty'
  | 'performance_missing_swim_predictors'
  | 'training_plan_empty'
  | 'athlete_missing_thresholds'
  | 'import_empty_history';

export type PrototypeDataSet = {
  athleteProfile: AthleteProfile;
  trainingGoals: TrainingGoal[];
  trainingZoneSets: TrainingZoneSet[];
  trainingZones: TrainingZone[];
  activities: Activity[];
  trainingPlan: TrainingPlan;
  plannedWorkouts: PlannedWorkout[];
  workoutSteps: WorkoutStep[];
  weeklySummary: WeeklySummary;
  aiCoachPreview: AiCoachPreview;
  performanceStats: PerformanceStats;
};

const prototypeFixtureKeys: PrototypeFixtureKey[] = [
  'default',
  'dashboard_empty',
  'performance_missing_swim_predictors',
  'training_plan_empty',
  'athlete_missing_thresholds',
  'import_empty_history',
];

const defaultPrototypeDataSet: PrototypeDataSet = {
  athleteProfile: prototypeAthleteProfile,
  trainingGoals: prototypeTrainingGoals,
  trainingZoneSets: prototypeTrainingZoneSets,
  trainingZones: prototypeTrainingZones,
  activities: prototypeActivities,
  trainingPlan: prototypeTrainingPlan,
  plannedWorkouts: prototypePlannedWorkouts,
  workoutSteps: prototypeWorkoutSteps,
  weeklySummary: prototypeWeeklySummary,
  aiCoachPreview: prototypeAiCoachPreview,
  performanceStats: prototypePerformanceStats,
};

const createDashboardEmptyDataSet = (): PrototypeDataSet => ({
  ...defaultPrototypeDataSet,
  activities: [],
  plannedWorkouts: [],
});

const createPerformanceWithoutSwimPredictorsDataSet = (): PrototypeDataSet => ({
  ...defaultPrototypeDataSet,
  performanceStats: {
    ...defaultPrototypeDataSet.performanceStats,
    racePredictions: (
      defaultPrototypeDataSet.performanceStats.racePredictions ?? []
    ).filter((prediction) => prediction.sport !== 'swimming'),
  },
});

const createEmptyTrainingPlanDataSet = (): PrototypeDataSet => ({
  ...defaultPrototypeDataSet,
  plannedWorkouts: [],
  workoutSteps: [],
});

const createAthleteWithoutThresholdsDataSet = (): PrototypeDataSet => {
  const athleteProfile: AthleteProfile = {
    ...defaultPrototypeDataSet.athleteProfile,
  };

  delete athleteProfile.currentFtpWatts;
  delete athleteProfile.maxHeartRateBpm;
  delete athleteProfile.restingHeartRateBpm;
  delete athleteProfile.runningThresholdHrBpm;
  delete athleteProfile.runningThresholdPaceSecPerKm;
  delete athleteProfile.swimmingThresholdPaceSecPer100m;

  return {
    ...defaultPrototypeDataSet,
    athleteProfile,
  };
};

const prototypeDataSets: Record<PrototypeFixtureKey, PrototypeDataSet> = {
  default: defaultPrototypeDataSet,
  dashboard_empty: createDashboardEmptyDataSet(),
  performance_missing_swim_predictors:
    createPerformanceWithoutSwimPredictorsDataSet(),
  training_plan_empty: createEmptyTrainingPlanDataSet(),
  athlete_missing_thresholds: createAthleteWithoutThresholdsDataSet(),
  import_empty_history: defaultPrototypeDataSet,
};

function isPrototypeFixtureKey(
  fixtureKey: string | null,
): fixtureKey is PrototypeFixtureKey {
  return prototypeFixtureKeys.includes(fixtureKey as PrototypeFixtureKey);
}

export function getActivePrototypeFixtureKey(): PrototypeFixtureKey {
  if (import.meta.env.VITE_ENABLE_PROTOTYPE_FIXTURES !== 'true') {
    return 'default';
  }

  if (typeof window === 'undefined') {
    return 'default';
  }

  const fixtureKey = new URLSearchParams(window.location.search).get('fixture');

  return isPrototypeFixtureKey(fixtureKey) ? fixtureKey : 'default';
}

export function getActivePrototypeDataSet(): PrototypeDataSet {
  return prototypeDataSets[getActivePrototypeFixtureKey()];
}
