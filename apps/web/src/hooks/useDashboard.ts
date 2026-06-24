import { useCallback, useEffect, useState } from 'react';

import type {
  ActivitySummaryDto,
  AthleteSettingsDto,
  PlannedWorkoutDto,
  TrainingGoalDto,
} from '@pp-trainer/shared';

import { fetchActivities, fetchActivitiesForWeek } from '../api/activitiesApi';
import { fetchAthleteSettings } from '../api/athleteApi';
import { fetchWorkoutsForWeek } from '../api/trainingApi';
import { mapApiActivity } from '../api/mapApiActivity';
import type { Activity, SportType } from '../mock/prototypeData.types';

export type WeekVolume = {
  totalSeconds: number;
  totalDistanceMeters: number;
  bySport: Partial<Record<SportType, number>>;
};

export type PlannedSummary = {
  totalSeconds: number;
  totalDistanceMeters: number;
  bySport: Partial<Record<SportType, number>>;
  easySeconds: number;
  moderateHardSeconds: number;
  completedSeconds: number;
  remainingSeconds: number;
};

export type DashboardData = {
  weekStart: string;
  weekEnd: string;
  recentActivities: Activity[];
  weekVolume: WeekVolume;
  plannedWorkouts: PlannedWorkoutDto[];
  plannedSummary: PlannedSummary;
  upcomingWorkouts: PlannedWorkoutDto[];
  mainGoal: TrainingGoalDto | null;
  secondaryGoals: TrainingGoalDto[];
  watchlistGoals: TrainingGoalDto[];
  settings: AthleteSettingsDto;
};

export type DashboardState =
  | { status: 'loading' }
  | { status: 'ready'; data: DashboardData }
  | { status: 'error'; message: string };

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const daysFromMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: toLocalDate(monday),
    weekEnd: toLocalDate(sunday),
  };
}

function computeWeekVolume(activities: ActivitySummaryDto[]): WeekVolume {
  const bySport: Partial<Record<SportType, number>> = {};
  let totalSeconds = 0;
  let totalDistanceMeters = 0;
  for (const a of activities) {
    const sport = a.sport as SportType;
    bySport[sport] = (bySport[sport] ?? 0) + a.metrics.durationSeconds;
    totalSeconds += a.metrics.durationSeconds;
    totalDistanceMeters += a.metrics.distanceMeters ?? 0;
  }
  return { totalSeconds, totalDistanceMeters, bySport };
}

function computePlannedSummary(workouts: PlannedWorkoutDto[]): PlannedSummary {
  const bySport: Partial<Record<SportType, number>> = {};
  let totalSeconds = 0;
  let totalDistanceMeters = 0;
  let easySeconds = 0;
  let moderateHardSeconds = 0;
  let completedSeconds = 0;
  let remainingSeconds = 0;

  for (const w of workouts) {
    const dur = w.plannedDurationSeconds ?? 0;
    const sport = w.sport as SportType;
    bySport[sport] = (bySport[sport] ?? 0) + dur;
    totalSeconds += dur;
    totalDistanceMeters += w.plannedDistanceMeters ?? 0;
    if (['recovery', 'easy'].includes(w.intensity)) easySeconds += dur;
    else if (['moderate', 'tempo', 'threshold', 'vo2max', 'race', 'strength'].includes(w.intensity))
      moderateHardSeconds += dur;
    if (w.status === 'completed') completedSeconds += dur;
    if (w.status === 'planned') remainingSeconds += dur;
  }

  return { totalSeconds, totalDistanceMeters, bySport, easySeconds, moderateHardSeconds, completedSeconds, remainingSeconds };
}

export function useDashboard(): DashboardState & { refresh: () => void } {
  const [state, setState] = useState<DashboardState>({ status: 'loading' });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setState({ status: 'loading' });
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const { weekStart, weekEnd } = getCurrentWeekRange();

    Promise.all([
      fetchActivities(),
      fetchActivitiesForWeek(weekStart, weekEnd),
      fetchAthleteSettings(),
      fetchWorkoutsForWeek(weekStart, weekEnd),
    ])
      .then(([allActivities, weekActivities, settings, plannedWorkouts]) => {
        if (cancelled) return;

        const activeGoals = settings.goals.filter((g) => g.isActive);
        const mainGoal = activeGoals.find((g) => g.priority === 'main_goal') ?? null;
        const secondaryGoals = activeGoals.filter((g) => g.priority === 'secondary_goal');
        const watchlistGoals = activeGoals.filter((g) => g.priority === 'watchlist');

        const today = toLocalDate(new Date());
        const upcomingWorkouts = plannedWorkouts
          .filter((w) => w.status === 'planned' && w.scheduledDate >= today)
          .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

        setState({
          status: 'ready',
          data: {
            weekStart,
            weekEnd,
            recentActivities: allActivities.slice(0, 3).map(mapApiActivity),
            weekVolume: computeWeekVolume(weekActivities),
            plannedWorkouts,
            plannedSummary: computePlannedSummary(plannedWorkouts),
            upcomingWorkouts,
            mainGoal,
            secondaryGoals,
            watchlistGoals,
            settings,
          },
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load dashboard',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { ...state, refresh };
}
