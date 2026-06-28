import { useState } from 'react';
import type { HrvStatusDto } from '@pp-trainer/shared';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useHrvStatus } from '../../hooks/useHrvStatus';
import type { HealthRange } from '../../hooks/useHealthRange';
import { ErrorState } from '../states/ErrorState';
import { LoadingState } from '../states/LoadingState';
import { HealthEmptyState } from './HealthEmptyState';
import { formatDayLabel, formatNumber, formatShortDate } from './healthCardFormat';
import { HealthMetricRow, HealthRangeToggle } from './HealthCardUtils';

type HrvRow = {
  label: string;
  date: string;
  weeklyAvgHrv?: number;
  lastNightFiveMinHigh?: number;
  status?: HrvStatusDto['status'];
};

const HRV_STATUS_LABELS: Record<NonNullable<HrvStatusDto['status']>, string> = {
  balanced: 'Balanced',
  unbalanced: 'Unbalanced',
  poor: 'Poor',
  low: 'Low',
  none: 'None',
};

function buildRows(statuses: HrvStatusDto[]): HrvRow[] {
  return [...statuses]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((status) => ({
      label: formatDayLabel(status.date),
      date: status.date,
      weeklyAvgHrv: status.weeklyAvgHrv,
      lastNightFiveMinHigh: status.lastNightFiveMinHigh,
      status: status.status,
    }));
}

function hasHrvData(statuses: HrvStatusDto[]): boolean {
  return statuses.some((status) => status.weeklyAvgHrv != null || status.lastNightFiveMinHigh != null || status.status != null);
}

function getLatest(statuses: HrvStatusDto[]): HrvStatusDto | undefined {
  return [...statuses].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function HrvCard() {
  const [range, setRange] = useState<HealthRange>('14d');
  const state = useHrvStatus(range);
  const data = state.data ?? [];
  const hasData = hasHrvData(data);
  const isInitialLoading = state.status === 'loading' && data.length === 0;
  const isRefreshing = state.status === 'loading' && data.length > 0;
  const hasBlockingError = state.status === 'error' && data.length === 0;

  const latest = getLatest(data);
  const reference = latest?.weeklyAvgHrv;

  return (
    <article className={`dashboard-health-card${isRefreshing ? ' is-updating' : ''}`} aria-busy={isRefreshing}>
      <header className="dashboard-health-card__header">
        <div>
          <p>HRV</p>
          <h3>Nightly peak and status</h3>
        </div>
        <HealthRangeToggle value={range} options={['14d', '30d']} onChange={setRange} />
      </header>

      {isRefreshing && <span className="dashboard-health-card__sync">Updating</span>}
      {isInitialLoading && <LoadingState title="Loading HRV data" variant="inline" />}
      {state.status === 'error' && hasBlockingError && (
        <ErrorState title="Could not load HRV data" description={state.message} variant="inline" />
      )}
      {state.status === 'error' && data.length > 0 && (
        <p className="dashboard-health-card__warning">Could not refresh. Showing last loaded data.</p>
      )}
      {state.status !== 'loading' && !hasData && !hasBlockingError && <HealthEmptyState type="HRV" />}
      {hasData && (
        <>
          <div className="dashboard-health-chart">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={buildRows(data)} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="rgba(34, 38, 46, 0.09)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#747986', fontSize: 12 }} />
                <Tooltip cursor={{ stroke: 'rgba(215, 31, 133, 0.16)' }} />
                {reference != null && (
                  <ReferenceLine y={reference} stroke="rgba(22, 20, 24, 0.36)" strokeDasharray="4 4" />
                )}
                <Line
                  type="monotone"
                  dataKey="lastNightFiveMinHigh"
                  name="5-min high"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  animationDuration={320}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="dashboard-health-status-row">
            {data.map((item) => (
              <span
                key={item.id}
                className={`dashboard-health-status dashboard-health-status--${item.status ?? 'none'}`}
                title={`${formatShortDate(item.date)} · ${HRV_STATUS_LABELS[item.status ?? 'none']}`}
              >
                {formatDayLabel(item.date)}
              </span>
            ))}
          </div>
          <HealthMetricRow
            items={[
              { label: 'Weekly avg', value: formatNumber(latest?.weeklyAvgHrv, ' ms') },
              { label: 'Last night high', value: formatNumber(latest?.lastNightFiveMinHigh, ' ms') },
              {
                label: 'Status',
                value: (
                  <span className={`dashboard-health-status dashboard-health-status--${latest?.status ?? 'none'}`}>
                    {HRV_STATUS_LABELS[latest?.status ?? 'none']}
                  </span>
                ),
              },
            ]}
          />
        </>
      )}
    </article>
  );
}
