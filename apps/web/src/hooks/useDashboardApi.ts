import { useEffect, useState } from 'react';

import type { ActivitySummaryDto } from '@pp-trainer/shared';

import { fetchActivities, fetchActivitiesForWeek } from '../api/activitiesApi';
import { mapApiActivity } from '../api/mapApiActivity';
import type { Activity, SportType } from '../mock/prototypeData.types';

export type WeekVolume = {
  totalSeconds: number;
  totalDistanceMeters: number;
  bySport: Partial<Record<SportType, number>>;
};

export type DashboardApiState =
  | { status: 'loading' }
  | {
      status: 'success';
      recentActivities: Activity[];
      weekVolume: WeekVolume;
      weekStart: string;
      weekEnd: string;
    }
  | { status: 'error'; message: string };

function getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const daysFromMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}

function computeWeekVolume(activities: ActivitySummaryDto[]): WeekVolume {
  const bySport: Partial<Record<SportType, number>> = {};
  let totalSeconds = 0;
  let totalDistanceMeters = 0;

  for (const a of activities) {
    const sport = a.sport as SportType;
    const dur = a.metrics.durationSeconds;
    bySport[sport] = (bySport[sport] ?? 0) + dur;
    totalSeconds += dur;
    totalDistanceMeters += a.metrics.distanceMeters ?? 0;
  }

  return { totalSeconds, totalDistanceMeters, bySport };
}

export function useDashboardApi(): DashboardApiState {
  const [state, setState] = useState<DashboardApiState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const { weekStart, weekEnd } = getCurrentWeekRange();

    Promise.all([fetchActivities(), fetchActivitiesForWeek(weekStart, weekEnd)])
      .then(([allActivities, weekActivities]) => {
        if (cancelled) return;
        setState({
          status: 'success',
          recentActivities: allActivities.slice(0, 3).map(mapApiActivity),
          weekVolume: computeWeekVolume(weekActivities),
          weekStart,
          weekEnd,
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
  }, []);

  return state;
}
