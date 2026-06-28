import { useState } from 'react';
import type { DailyHealthSummaryDto } from '@pp-trainer/shared';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useDailyHealth } from '../../hooks/useDailyHealth';
import type { HealthRange } from '../../hooks/useHealthRange';
import { ErrorState } from '../states/ErrorState';
import { LoadingState } from '../states/LoadingState';
import { HealthEmptyState } from './HealthEmptyState';
import { average, formatDayLabel, formatNumber } from './healthCardFormat';
import {
  HealthMetricRow,
  HealthRangeToggle,
} from './HealthCardUtils';

type DailyHealthRow = {
  label: string;
  bodyBatteryLow?: number;
  bodyBatteryHigh?: number;
  bodyBatteryRange?: number;
  avgStressLevel?: number;
  steps?: number;
  restingHeartRate?: number;
};

function buildRows(days: DailyHealthSummaryDto[]): DailyHealthRow[] {
  return [...days]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => ({
      label: formatDayLabel(day.date),
      bodyBatteryLow: day.bodyBatteryLow,
      bodyBatteryHigh: day.bodyBatteryHigh,
      bodyBatteryRange: day.bodyBatteryLow != null && day.bodyBatteryHigh != null
        ? Math.max(0, day.bodyBatteryHigh - day.bodyBatteryLow)
        : undefined,
      avgStressLevel: day.avgStressLevel,
      steps: day.steps,
      restingHeartRate: day.restingHeartRate,
    }));
}

function hasDailyHealthData(days: DailyHealthSummaryDto[]): boolean {
  return days.some((day) =>
    day.bodyBatteryLow != null ||
    day.bodyBatteryHigh != null ||
    day.avgStressLevel != null ||
    day.steps != null ||
    day.restingHeartRate != null,
  );
}

export function HealthSummaryCard() {
  const [range, setRange] = useState<HealthRange>('7d');
  const state = useDailyHealth(range);
  const data = state.data ?? [];
  const hasData = hasDailyHealthData(data);
  const isInitialLoading = state.status === 'loading' && data.length === 0;
  const isRefreshing = state.status === 'loading' && data.length > 0;
  const hasBlockingError = state.status === 'error' && data.length === 0;

  return (
    <article
      className={`dashboard-health-card dashboard-health-card--wide${isRefreshing ? ' is-updating' : ''}`}
      aria-busy={isRefreshing}
    >
      <header className="dashboard-health-card__header">
        <div>
          <p>Daily Health Summary</p>
          <h3>Body battery, stress and movement</h3>
        </div>
        <HealthRangeToggle value={range} onChange={setRange} />
      </header>

      {isRefreshing && <span className="dashboard-health-card__sync">Updating</span>}
      {isInitialLoading && (
        <LoadingState title="Loading health data" variant="inline" />
      )}
      {state.status === 'error' && hasBlockingError && (
        <ErrorState title="Could not load health data" description={state.message} variant="inline" />
      )}
      {state.status === 'error' && data.length > 0 && (
        <p className="dashboard-health-card__warning">Could not refresh. Showing last loaded data.</p>
      )}
      {state.status !== 'loading' && !hasData && !hasBlockingError && (
        <HealthEmptyState type="health" />
      )}
      {hasData && (
        <>
          <div className="dashboard-health-chart dashboard-health-chart--daily">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={buildRows(data)} margin={{ top: 10, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="rgba(34, 38, 46, 0.09)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 12 }} />
                <YAxis yAxisId="score" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 12 }} />
                <YAxis yAxisId="steps" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 12 }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                <Tooltip cursor={{ fill: 'rgba(215, 31, 133, 0.06)' }} />
                <Bar yAxisId="score" dataKey="bodyBatteryLow" stackId="battery" fill="transparent" animationDuration={320} />
                <Bar yAxisId="score" dataKey="bodyBatteryRange" name="Body Battery range" stackId="battery" fill="var(--color-accent)" radius={[4, 4, 0, 0]} animationDuration={320} />
                <Area yAxisId="steps" type="monotone" dataKey="steps" name="Steps" fill="rgba(26, 116, 232, 0.12)" stroke="#1a74e8" animationDuration={320} />
                <Line yAxisId="score" type="monotone" dataKey="avgStressLevel" name="Stress" stroke="#f2641a" strokeWidth={2} dot={{ r: 3 }} animationDuration={320} />
                <Line yAxisId="score" type="monotone" dataKey="restingHeartRate" name="Resting HR" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} animationDuration={320} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <HealthMetricRow
            items={[
              { label: 'Avg steps', value: formatNumber(average(data.map((day) => day.steps))) },
              { label: 'Avg resting HR', value: formatNumber(average(data.map((day) => day.restingHeartRate)), ' bpm') },
              { label: 'Avg stress', value: formatNumber(average(data.map((day) => day.avgStressLevel))) },
            ]}
          />
        </>
      )}
    </article>
  );
}
