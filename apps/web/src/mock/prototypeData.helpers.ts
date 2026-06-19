import { getActivePrototypeDataSet } from './prototypeData.fixtures';
import type {
  Activity,
  AiCoachPreview,
  AthleteProfile,
  DashboardSummary,
  PerformanceStats,
  PlannedWorkout,
  RacePrediction,
  SportType,
  TrainingGoal,
  TrainingPlan,
  TrainingZoneSet,
  TrainingZone,
  TrainingZoneType,
  WeeklySummary,
  WorkoutStep,
} from './prototypeData.types';

const compareByStartTimeDescending = (first: Activity, second: Activity) =>
  new Date(second.startTime).getTime() - new Date(first.startTime).getTime();

const compareByScheduledTimeAscending = (
  first: PlannedWorkout,
  second: PlannedWorkout,
) => {
  const firstTime =
    first.scheduledStartTime ?? `${first.scheduledDate}T00:00:00.000Z`;
  const secondTime =
    second.scheduledStartTime ?? `${second.scheduledDate}T00:00:00.000Z`;

  return new Date(firstTime).getTime() - new Date(secondTime).getTime();
};

export const getAthleteProfile = (): AthleteProfile =>
  getActivePrototypeDataSet().athleteProfile;

export const getActivities = (): Activity[] =>
  [...getActivePrototypeDataSet().activities].sort(compareByStartTimeDescending);

export const getActivityById = (activityId: string): Activity | undefined =>
  getActivePrototypeDataSet().activities.find(
    (activity) => activity.id === activityId,
  );

export const getRecentActivities = (limit = 5): Activity[] =>
  getActivities().slice(0, limit);

export const getCurrentTrainingPlan = (): TrainingPlan =>
  getActivePrototypeDataSet().trainingPlan;

export const getPlannedWorkouts = (): PlannedWorkout[] =>
  [...getActivePrototypeDataSet().plannedWorkouts].sort(
    compareByScheduledTimeAscending,
  );

export const getWorkoutById = (workoutId: string): PlannedWorkout | undefined =>
  getActivePrototypeDataSet().plannedWorkouts.find(
    (workout) => workout.id === workoutId,
  );

export const getWorkoutSteps = (workoutId: string): WorkoutStep[] =>
  getActivePrototypeDataSet()
    .workoutSteps
    .filter((step) => step.plannedWorkoutId === workoutId)
    .sort((first, second) => first.stepIndex - second.stepIndex);

export const getUpcomingWorkouts = (limit = 3): PlannedWorkout[] =>
  getPlannedWorkouts()
    .filter((workout) => workout.status === 'planned')
    .slice(0, limit);

export const getTrainingZones = (): TrainingZone[] => [
  ...getActivePrototypeDataSet().trainingZones,
];

export const getTrainingZoneSets = (): TrainingZoneSet[] => [
  ...getActivePrototypeDataSet().trainingZoneSets,
];

export const getActiveTrainingZoneSets = (): TrainingZoneSet[] =>
  getTrainingZoneSets().filter((zoneSet) => zoneSet.isActive);

export const getTrainingZoneSetsBySport = (
  sport: SportType,
): TrainingZoneSet[] =>
  getTrainingZoneSets().filter((zoneSet) => zoneSet.sport === sport);

export const getTrainingZoneSetsByType = (
  zoneType: TrainingZoneType,
): TrainingZoneSet[] =>
  getTrainingZoneSets().filter((zoneSet) => zoneSet.zoneType === zoneType);

export const getActiveTrainingZoneSetsByType = (
  zoneType: TrainingZoneType,
): TrainingZoneSet[] =>
  getActiveTrainingZoneSets().filter((zoneSet) => zoneSet.zoneType === zoneType);

export const getTrainingZonesBySetId = (zoneSetId: string): TrainingZone[] =>
  getTrainingZones()
    .filter((zone) => zone.trainingZoneSetId === zoneSetId)
    .sort((first, second) => first.zoneNumber - second.zoneNumber);

export const getPerformanceStats = (): PerformanceStats =>
  getActivePrototypeDataSet().performanceStats;

export const getPerformanceRacePredictionsBySport = (
  sport: SportType,
): RacePrediction[] =>
  (getPerformanceStats().racePredictions ?? []).filter(
    (prediction) => prediction.sport === sport,
  );

export const getAiCoachPreview = (): AiCoachPreview =>
  getActivePrototypeDataSet().aiCoachPreview;

export const getTrainingGoals = (): TrainingGoal[] => [
  ...getActivePrototypeDataSet().trainingGoals,
];

export const getActiveTrainingGoals = (): TrainingGoal[] =>
  getTrainingGoals().filter((goal) => goal.isActive);

export const getMainTrainingGoal = (): TrainingGoal | undefined =>
  getActiveTrainingGoals().find((goal) => goal.priority === 'main_goal');

export const getSecondaryTrainingGoals = (): TrainingGoal[] =>
  getActiveTrainingGoals().filter((goal) => goal.priority === 'secondary_goal');

export const getWatchlistTrainingGoals = (): TrainingGoal[] =>
  getActiveTrainingGoals().filter((goal) => goal.priority === 'watchlist');

export const getActiveTrainingGoal = (): TrainingGoal | undefined =>
  getMainTrainingGoal();

export const getWeeklySummary = (): WeeklySummary =>
  getActivePrototypeDataSet().weeklySummary;

export const getDashboardSummary = (): DashboardSummary => ({
  athleteProfile: getAthleteProfile(),
  activeGoal: getActiveTrainingGoal(),
  currentWeek: getWeeklySummary(),
  currentTrainingPlan: getCurrentTrainingPlan(),
  recentActivities: getRecentActivities(4),
  upcomingWorkouts: getUpcomingWorkouts(3),
  aiCoachPreview: getAiCoachPreview(),
});
