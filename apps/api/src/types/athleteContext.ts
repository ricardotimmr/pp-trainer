import type {
  ActivitySummaryDto,
  AthleteProfileDto,
  PerformanceStatsDto,
  TrainingAvailabilityDto,
  TrainingGoalDto,
  TrainingPlanDto,
  TrainingZoneSetDto,
} from '@pp-trainer/shared';

export type AthleteGoalSummary = {
  mainGoal: TrainingGoalDto | null;
  secondaryGoals: TrainingGoalDto[];
  watchlistGoals: TrainingGoalDto[];
};

export type CurrentWeekSummary = {
  weekStart: string;
  weekEnd: string;
  trainingPlan: TrainingPlanDto | null;
};

export type AthleteContextV1 = {
  version: 'v1';
  generatedAt: string;
  athleteProfile: AthleteProfileDto;
  goals: AthleteGoalSummary;
  availability: TrainingAvailabilityDto[];
  trainingZones: TrainingZoneSetDto[];
  recentActivities: ActivitySummaryDto[];
  currentWeek: CurrentWeekSummary;
  performanceStats: PerformanceStatsDto;
};
