import { useState } from 'react';
import type { DailyHealthSummaryDto } from '@pp-trainer/shared';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
  const rows = buildRows(data);
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
          <div className="dashboard-health-daily-grid">
            <section className="dashboard-health-signal dashboard-health-signal--battery" aria-label="Body Battery range">
              <header>
                <span>Body Battery</span>
                <strong>Low / high range</strong>
              </header>
              <div className="dashboard-health-chart dashboard-health-chart--mini">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
                    <CartesianGrid stroke="rgba(34, 38, 46, 0.08)" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 11 }} />
                    <Tooltip cursor={{ fill: 'rgba(235, 15, 122, 0.06)' }} />
                    <Bar dataKey="bodyBatteryLow" stackId="battery" fill="transparent" animationDuration={320} />
                    <Bar dataKey="bodyBatteryRange" name="Range" stackId="battery" fill="var(--color-accent)" radius={[4, 4, 0, 0]} animationDuration={320} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="dashboard-health-signal dashboard-health-signal--stress" aria-label="Average stress">
              <header>
                <span>Stress</span>
                <strong>Daily average</strong>
              </header>
              <div className="dashboard-health-chart dashboard-health-chart--mini">
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
                    <CartesianGrid stroke="rgba(34, 38, 46, 0.08)" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 11 }} />
                    <Tooltip cursor={{ stroke: 'rgba(242, 100, 26, 0.18)' }} />
                    <Line type="monotone" dataKey="avgStressLevel" name="Stress" stroke="#f2641a" strokeWidth={2} dot={{ r: 3 }} animationDuration={320} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="dashboard-health-signal dashboard-health-signal--steps" aria-label="Steps">
              <header>
                <span>Steps</span>
                <strong>Daily count</strong>
              </header>
              <div className="dashboard-health-chart dashboard-health-chart--mini">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
                    <CartesianGrid stroke="rgba(34, 38, 46, 0.08)" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 11 }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                    <Tooltip cursor={{ fill: 'rgba(26, 116, 232, 0.07)' }} />
                    <Bar dataKey="steps" name="Steps" fill="#1a74e8" radius={[4, 4, 0, 0]} animationDuration={320} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="dashboard-health-signal dashboard-health-signal--resting-hr" aria-label="Resting heart rate">
              <header>
                <span>Resting HR</span>
                <strong>Morning baseline</strong>
              </header>
              <div className="dashboard-health-chart dashboard-health-chart--mini">
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
                    <CartesianGrid stroke="rgba(34, 38, 46, 0.08)" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 11 }} />
                    <Tooltip cursor={{ stroke: 'rgba(124, 58, 237, 0.18)' }} />
                    <Line type="monotone" dataKey="restingHeartRate" name="Resting HR" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} animationDuration={320} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
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
