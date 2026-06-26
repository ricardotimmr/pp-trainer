import { useEffect, useState } from 'react';

import type { SportDistributionDto, WeeklySummaryDto } from '@pp-trainer/shared';

import { fetchSportDistribution, fetchWeeklySummary } from '../api/analyticsApi';

export type DashboardAnalyticsData = {
  weeklySummary: WeeklySummaryDto[];
  sportDistribution: SportDistributionDto[];
};

export type DashboardAnalyticsState =
  | { status: 'loading' }
  | { status: 'ready'; data: DashboardAnalyticsData }
  | { status: 'error'; message: string };

function toLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getLastFourWeeksRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - 27);
  return {
    from: toLocalDate(from),
    to: toLocalDate(to),
  };
}

export function useDashboardAnalytics(): DashboardAnalyticsState {
  const [state, setState] = useState<DashboardAnalyticsState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const { from, to } = getLastFourWeeksRange();

    Promise.all([fetchWeeklySummary(8), fetchSportDistribution(from, to)])
      .then(([weeklySummary, sportDistribution]) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          data: { weeklySummary, sportDistribution },
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load analytics',
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
