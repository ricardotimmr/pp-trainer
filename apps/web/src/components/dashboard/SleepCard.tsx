import { useState } from 'react';
import type { SleepSessionDto } from '@pp-trainer/shared';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useSleepSessions } from '../../hooks/useSleepSessions';
import type { HealthRange } from '../../hooks/useHealthRange';
import { ErrorState } from '../states/ErrorState';
import { LoadingState } from '../states/LoadingState';
import { HealthEmptyState } from './HealthEmptyState';
import {
  average,
  formatDayLabel,
  formatHoursFromSeconds,
  formatNumber,
} from './healthCardFormat';
import {
  HealthMetricRow,
  HealthRangeToggle,
} from './HealthCardUtils';

type SleepRow = {
  label: string;
  deepHours: number;
  lightHours: number;
  remHours: number;
  awakeHours: number;
  sleepScore?: number;
};

function toHours(seconds?: number): number {
  return Math.round(((seconds ?? 0) / 3600) * 10) / 10;
}

function buildRows(sessions: SleepSessionDto[]): SleepRow[] {
  return [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((session) => ({
      label: formatDayLabel(session.date),
      deepHours: toHours(session.deepSleepSeconds),
      lightHours: toHours(session.lightSleepSeconds),
      remHours: toHours(session.remSleepSeconds),
      awakeHours: toHours(session.awakeSeconds),
      sleepScore: session.sleepScore,
    }));
}

function hasSleepData(sessions: SleepSessionDto[]): boolean {
  return sessions.some((session) => session.totalSleepSeconds != null || session.sleepScore != null);
}

export function SleepCard() {
  const [range, setRange] = useState<HealthRange>('7d');
  const state = useSleepSessions(range);
  const data = state.data ?? [];
  const hasData = hasSleepData(data);
  const isInitialLoading = state.status === 'loading' && data.length === 0;
  const isRefreshing = state.status === 'loading' && data.length > 0;
  const hasBlockingError = state.status === 'error' && data.length === 0;

  return (
    <article className={`dashboard-health-card${isRefreshing ? ' is-updating' : ''}`} aria-busy={isRefreshing}>
      <header className="dashboard-health-card__header">
        <div>
          <p>Sleep</p>
          <h3>Stages and score</h3>
        </div>
        <HealthRangeToggle value={range} onChange={setRange} />
      </header>

      {isRefreshing && <span className="dashboard-health-card__sync">Updating</span>}
      {isInitialLoading && <LoadingState title="Loading sleep data" variant="inline" />}
      {state.status === 'error' && hasBlockingError && (
        <ErrorState title="Could not load sleep data" description={state.message} variant="inline" />
      )}
      {state.status === 'error' && data.length > 0 && (
        <p className="dashboard-health-card__warning">Could not refresh. Showing last loaded data.</p>
      )}
      {state.status !== 'loading' && !hasData && !hasBlockingError && <HealthEmptyState type="sleep" />}
      {hasData && (
        <>
          <div className="dashboard-health-chart">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={buildRows(data)} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="rgba(34, 38, 46, 0.09)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 12 }} tickFormatter={(value) => `${value}h`} />
                <Tooltip cursor={{ fill: 'rgba(215, 31, 133, 0.06)' }} />
                <Bar dataKey="deepHours" name="Deep" stackId="sleep" fill="var(--sleep-deep)" animationDuration={320} />
                <Bar dataKey="lightHours" name="Light" stackId="sleep" fill="var(--sleep-light)" animationDuration={320} />
                <Bar dataKey="remHours" name="REM" stackId="sleep" fill="var(--sleep-rem)" animationDuration={320} />
                <Bar dataKey="awakeHours" name="Awake" stackId="sleep" fill="var(--sleep-awake)" radius={[4, 4, 0, 0]} animationDuration={320} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="dashboard-health-score-row">
            {data.map((session) => (
              <span key={session.id} className="dashboard-health-score" title={session.date}>
                {formatDayLabel(session.date)} {session.sleepScore ?? 'n/a'}
              </span>
            ))}
          </div>
          <HealthMetricRow
            items={[
              { label: 'Avg total', value: formatHoursFromSeconds(average(data.map((session) => session.totalSleepSeconds))) },
              { label: 'Avg deep', value: formatHoursFromSeconds(average(data.map((session) => session.deepSleepSeconds))) },
              { label: 'Avg score', value: formatNumber(average(data.map((session) => session.sleepScore))) },
            ]}
          />
        </>
      )}
    </article>
  );
}
