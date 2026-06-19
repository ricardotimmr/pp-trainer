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
  DashboardSummary,
  PerformanceStats,
  PlannedWorkout,
  RacePrediction,
  SportType,
  TrainingGoal,
  TrainingPlan,
  TrainingZoneSet,
  TrainingZone,
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

export const getActivities = (): Activity[] =>
  [...prototypeActivities].sort(compareByStartTimeDescending);

export const getActivityById = (activityId: string): Activity | undefined =>
  prototypeActivities.find((activity) => activity.id === activityId);

export const getRecentActivities = (limit = 5): Activity[] =>
  getActivities().slice(0, limit);

export const getCurrentTrainingPlan = (): TrainingPlan => prototypeTrainingPlan;

export const getPlannedWorkouts = (): PlannedWorkout[] =>
  [...prototypePlannedWorkouts].sort(compareByScheduledTimeAscending);

export const getWorkoutById = (workoutId: string): PlannedWorkout | undefined =>
  prototypePlannedWorkouts.find((workout) => workout.id === workoutId);

export const getWorkoutSteps = (workoutId: string): WorkoutStep[] =>
  prototypeWorkoutSteps
    .filter((step) => step.plannedWorkoutId === workoutId)
    .sort((first, second) => first.stepIndex - second.stepIndex);

export const getUpcomingWorkouts = (limit = 3): PlannedWorkout[] =>
  getPlannedWorkouts()
    .filter((workout) => workout.status === 'planned')
    .slice(0, limit);

export const getTrainingZones = (): TrainingZone[] => [
  ...prototypeTrainingZones,
];

export const getTrainingZoneSets = (): TrainingZoneSet[] => [
  ...prototypeTrainingZoneSets,
];

export const getTrainingZoneSetsBySport = (
  sport: SportType,
): TrainingZoneSet[] =>
  getTrainingZoneSets().filter((zoneSet) => zoneSet.sport === sport);

export const getTrainingZonesBySetId = (zoneSetId: string): TrainingZone[] =>
  getTrainingZones()
    .filter((zone) => zone.trainingZoneSetId === zoneSetId)
    .sort((first, second) => first.zoneNumber - second.zoneNumber);

export const getPerformanceStats = (): PerformanceStats =>
  prototypePerformanceStats;

export const getPerformanceRacePredictionsBySport = (
  sport: SportType,
): RacePrediction[] =>
  (prototypePerformanceStats.racePredictions ?? []).filter(
    (prediction) => prediction.sport === sport,
  );

export const getActiveTrainingGoals = (): TrainingGoal[] =>
  prototypeTrainingGoals.filter((goal) => goal.isActive);

export const getMainTrainingGoal = (): TrainingGoal | undefined =>
  getActiveTrainingGoals().find((goal) => goal.priority === 'main_goal');

export const getSecondaryTrainingGoals = (): TrainingGoal[] =>
  getActiveTrainingGoals().filter((goal) => goal.priority === 'secondary_goal');

export const getWatchlistTrainingGoals = (): TrainingGoal[] =>
  getActiveTrainingGoals().filter((goal) => goal.priority === 'watchlist');

export const getActiveTrainingGoal = (): TrainingGoal | undefined =>
  getMainTrainingGoal();

export const getWeeklySummary = (): WeeklySummary => prototypeWeeklySummary;

export const getDashboardSummary = (): DashboardSummary => ({
  athleteProfile: prototypeAthleteProfile,
  activeGoal: getActiveTrainingGoal(),
  currentWeek: prototypeWeeklySummary,
  currentTrainingPlan: prototypeTrainingPlan,
  recentActivities: getRecentActivities(4),
  upcomingWorkouts: getUpcomingWorkouts(3),
  aiCoachPreview: prototypeAiCoachPreview,
});
