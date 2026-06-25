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

// ── AI Coach Context ─────────────────────────────────────────────────────────
// Compact, token-efficient context passed to the AI provider.
// Uses lowercase DTO values and omits IDs — AI never needs entity references.

export type AiAthleteInfo = {
  displayName: string;
  bodyWeightKg?: number;
  heightCm?: number;
  primarySports: string[];
  currentFtpWatts?: number;
  maxHeartRateBpm?: number;
  restingHeartRateBpm?: number;
  runningThresholdHrBpm?: number;
  runningThresholdPaceSecPerKm?: number;
  swimmingThresholdPaceSecPer100m?: number;
};

export type AiGoal = {
  title: string;
  goalType: string;
  targetDate?: string;
  sport?: string;
  priority: string;
  targetDistanceMeters?: number;
  targetDurationSeconds?: number;
  targetPaceSecPerKm?: number;
  targetPowerWatts?: number;
  targetSwimPaceSecPer100m?: number;
};

export type AiAvailabilityDay = {
  weekday: string;
  available: boolean;
  maxDurationMinutes?: number;
  preferredSports?: string[];
  notes?: string;
};

export type AiTrainingZoneSet = {
  zoneType: string;
  sport?: string;
  zones: {
    zoneNumber: number;
    name: string;
    lowerBound?: number;
    upperBound?: number;
    unit: string;
  }[];
};

export type AiRecentActivity = {
  sport: string;
  startTime: string;
  durationSeconds: number;
  distanceMeters?: number;
  averageHeartRateBpm?: number;
  averagePowerWatts?: number;
  averagePaceSecPerKm?: number;
  perceivedExertion?: number;
};

export type AiCurrentWeek = {
  weekStartDate: string;
  plannedWorkoutCount: number;
  completedActivityCount: number;
  plannedDurationSeconds?: number;
  completedDurationSeconds?: number;
  completedDurationBySport?: Record<string, number>;
};

export type AiPlannedWorkout = {
  sport: string;
  title: string;
  scheduledDate: string;
  plannedDurationSeconds?: number;
  intensity: string;
  status: string;
};

export type AiMonthlyTrainingSummary = {
  month: string;
  totalDurationSeconds: number;
  totalDistanceMeters?: number;
  activityCount: number;
  sportBreakdown: Record<string, number>;
};

export type AiTrainingHistory = {
  monthlyStats: AiMonthlyTrainingSummary[];
  peakWeekDurationSeconds?: number;
  totalActivitiesAllTime?: number;
};

export type AiCoachingMemory = {
  recentEntries: string[];
  olderSummary?: string;
};

export type AthleteContextForAi = {
  version: 'v1';
  generatedAt: string;
  athlete: AiAthleteInfo;
  goals: AiGoal[];
  availability: AiAvailabilityDay[];
  trainingZones: AiTrainingZoneSet[];
  recentActivities: AiRecentActivity[];
  currentWeek: AiCurrentWeek;
  plannedWorkouts?: AiPlannedWorkout[];
  trainingHistory?: AiTrainingHistory;
  coachingMemory?: AiCoachingMemory;
};
