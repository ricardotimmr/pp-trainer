import {
  prototypeActivities,
  prototypeAiCoachPreview,
  prototypeAthleteProfile,
  prototypePlannedWorkouts,
  prototypeTrainingGoals,
  prototypeTrainingPlan,
  prototypeTrainingZones,
  prototypeWeeklySummary,
  prototypeWorkoutSteps,
} from './prototypeData';
import type {
  Activity,
  DashboardSummary,
  PlannedWorkout,
  TrainingGoal,
  TrainingPlan,
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

export const getActiveTrainingGoal = (): TrainingGoal | undefined =>
  prototypeTrainingGoals.find((goal) => goal.isActive);

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
