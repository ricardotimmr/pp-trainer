import { useEffect, useState } from 'react';

import type {
  AthleteSettingsDto,
  TrainingAvailabilityDto,
  TrainingGoalDto,
} from '@pp-trainer/shared';

import { fetchAthleteSettings } from '../api/athleteApi';
import { fetchWorkoutsForWeek } from '../api/trainingApi';

function getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const daysFromMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}

export type AiCoachWeekLoad = {
  workoutCount: number;
  plannedDurationSeconds: number;
  cyclingDurationSeconds: number;
  runningDurationSeconds: number;
  swimmingDurationSeconds: number;
};

export type AiCoachSidebarData = {
  settings: AthleteSettingsDto;
  mainGoal: TrainingGoalDto | null;
  secondaryGoals: TrainingGoalDto[];
  watchlistGoals: TrainingGoalDto[];
  activeDays: TrainingAvailabilityDto[];
  weekLoad: AiCoachWeekLoad;
};

export type AiCoachSidebarState =
  | { status: 'loading' }
  | { status: 'ready'; data: AiCoachSidebarData }
  | { status: 'error' };

export function useAiCoachSidebar(): AiCoachSidebarState {
  const [state, setState] = useState<AiCoachSidebarState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const { weekStart, weekEnd } = getCurrentWeekRange();

    Promise.all([fetchAthleteSettings(), fetchWorkoutsForWeek(weekStart, weekEnd)])
      .then(([settings, workouts]) => {
        if (cancelled) return;

        const activeGoals = settings.goals.filter((g) => g.isActive);
        const mainGoal = activeGoals.find((g) => g.priority === 'main_goal') ?? null;
        const secondaryGoals = activeGoals.filter((g) => g.priority === 'secondary_goal');
        const watchlistGoals = activeGoals.filter((g) => g.priority === 'watchlist');
        const activeDays = settings.availability.filter(
          (a) => a.available && a.maxDurationMinutes != null,
        );

        const durBySport = (sport: string) =>
          workouts
            .filter((w) => w.sport === sport)
            .reduce((s, w) => s + (w.plannedDurationSeconds ?? 0), 0);

        const weekLoad: AiCoachWeekLoad = {
          workoutCount: workouts.length,
          plannedDurationSeconds: workouts.reduce(
            (s, w) => s + (w.plannedDurationSeconds ?? 0),
            0,
          ),
          cyclingDurationSeconds: durBySport('cycling'),
          runningDurationSeconds: durBySport('running'),
          swimmingDurationSeconds: durBySport('swimming'),
        };

        setState({
          status: 'ready',
          data: { settings, mainGoal, secondaryGoals, watchlistGoals, activeDays, weekLoad },
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
