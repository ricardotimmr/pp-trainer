import type { SportDistributionDto, SportTypeDto, WeeklySummaryDto } from '@pp-trainer/shared';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { sportLabels } from '../prototypeFormatters';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';
import { LoadingState } from '../states/LoadingState';
import type { DashboardAnalyticsState } from '../../hooks/useDashboardAnalytics';

const SPORT_ORDER: SportTypeDto[] = [
  'cycling',
  'running',
  'swimming',
  'strength',
  'mobility',
  'other',
];

const SPORT_COLORS: Record<SportTypeDto, string> = {
  cycling: '#1a74e8',
  running: '#f2641a',
  swimming: '#06aec4',
  strength: '#7c3aed',
  mobility: '#1f9d4d',
  other: '#8c8a90',
};

type WeeklyChartRow = {
  weekLabel: string;
  totalHours: number;
} & Partial<Record<SportTypeDto, number>>;

type TooltipPayloadItem = {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string | number;
};

function formatWeekLabel(dateValue: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${dateValue}T12:00:00Z`));
}

function formatHours(value: number): string {
  if (value === 0) return '0h';
  if (value < 0.1) return '<0.1h';
  return `${value.toFixed(1)}h`;
}

function toHours(seconds: number): number {
  return Math.round((seconds / 3600) * 10) / 10;
}

function buildWeeklyRows(summary: WeeklySummaryDto[]): WeeklyChartRow[] {
  return summary.map((week) => {
    const row: WeeklyChartRow = {
      weekLabel: formatWeekLabel(week.weekStart),
      totalHours: toHours(week.totalSeconds),
    };

    for (const item of week.bySport) {
      row[item.sport] = toHours(item.seconds);
    }

    return row;
  });
}

function buildTopSportMap(
  rows: WeeklyChartRow[],
  sports: SportTypeDto[],
): Record<string, SportTypeDto | null> {
  const map: Record<string, SportTypeDto | null> = {};
  for (const row of rows) {
    let top: SportTypeDto | null = null;
    for (const sport of sports) {
      if ((row[sport] as number | undefined ?? 0) > 0) top = sport;
    }
    map[row.weekLabel] = top;
  }
  return map;
}

type BarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  weekLabel?: string;
};

function makeBarShape(sport: SportTypeDto, topSportMap: Record<string, SportTypeDto | null>) {
  return function BarShape({ x = 0, y = 0, width = 0, height = 0, fill = '', weekLabel = '' }: BarShapeProps) {
    if (height <= 0 || width <= 0) return null;
    const isTop = topSportMap[weekLabel] === sport;
    const r = isTop ? Math.min(4, width / 2) : 0;
    return (
      <path
        d={`M${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} L${x},${y + height} Z`}
        fill={fill}
      />
    );
  };
}

function getVisibleSports(
  weeklySummary: WeeklySummaryDto[],
  distribution: SportDistributionDto[],
): SportTypeDto[] {
  const sports = new Set<SportTypeDto>();

  for (const week of weeklySummary) {
    for (const item of week.bySport) {
      if (item.seconds > 0) sports.add(item.sport);
    }
  }

  for (const item of distribution) {
    if (item.totalSeconds > 0) sports.add(item.sport);
  }

  return SPORT_ORDER.filter((sport) => sports.has(sport));
}

function hasWeeklyData(summary: WeeklySummaryDto[]): boolean {
  return summary.some((week) => week.totalSeconds > 0);
}

function hasDistributionData(distribution: SportDistributionDto[]): boolean {
  return distribution.some((item) => item.totalSeconds > 0);
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const visibleItems = payload.filter((item) => (item.value ?? 0) > 0);
  if (visibleItems.length === 0) return null;

  return (
    <div className="dashboard-chart-tooltip">
      <strong>{label}</strong>
      {visibleItems.map((item) => (
        <span key={String(item.dataKey)}>
          <i style={{ background: item.color }} />
          {item.name}: {formatHours(item.value ?? 0)}
        </span>
      ))}
    </div>
  );
}

function WeeklyVolumeChart({ summary, sports }: {
  summary: WeeklySummaryDto[];
  sports: SportTypeDto[];
}) {
  if (!hasWeeklyData(summary)) {
    return (
      <EmptyState
        title="No activity data yet"
        description="Weekly volume will appear once activities have been imported."
        variant="inline"
      />
    );
  }

  const rows = buildWeeklyRows(summary);
  const topSportMap = buildTopSportMap(rows, sports);

  return (
    <div className="dashboard-chart-frame" aria-label="Weekly volume chart">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} margin={{ top: 12, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="rgba(34, 38, 46, 0.09)" vertical={false} />
          <XAxis
            dataKey="weekLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#747986', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#747986', fontSize: 12 }}
            tickFormatter={(value) => formatHours(Number(value))}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(215, 31, 133, 0.06)' }} />
          {sports.map((sport) => (
            <Bar
              key={sport}
              dataKey={sport}
              name={sportLabels[sport]}
              stackId="training-volume"
              fill={SPORT_COLORS[sport]}
              shape={makeBarShape(sport, topSportMap)}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SportDistributionChart({ distribution }: { distribution: SportDistributionDto[] }) {
  if (!hasDistributionData(distribution)) {
    return (
      <EmptyState
        title="No activity data yet"
        description="Sport distribution will appear once activities exist in the last four weeks."
        variant="inline"
      />
    );
  }

  const totalSeconds = distribution.reduce((sum, item) => sum + item.totalSeconds, 0);
  const rows = [...distribution]
    .filter((item) => item.totalSeconds > 0)
    .sort((a, b) => b.totalSeconds - a.totalSeconds);

  return (
    <div className="dashboard-distribution" aria-label="Sport distribution chart">
      {rows.map((item) => {
        const percentage = totalSeconds > 0 ? (item.totalSeconds / totalSeconds) * 100 : 0;
        return (
          <div key={item.sport} className="dashboard-distribution__row">
            <div className="dashboard-distribution__label">
              <span
                className="dashboard-distribution__dot"
                style={{ background: SPORT_COLORS[item.sport] }}
              />
              <span>{sportLabels[item.sport]}</span>
            </div>
            <div className="dashboard-distribution__track" aria-hidden="true">
              <span
                className="dashboard-distribution__bar"
                style={{
                  width: `${Math.max(4, percentage)}%`,
                  background: SPORT_COLORS[item.sport],
                }}
              />
            </div>
            <div className="dashboard-distribution__value">
              <strong>{formatHours(toHours(item.totalSeconds))}</strong>
              <span>{Math.round(percentage)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardChartsSection({ state }: { state: DashboardAnalyticsState }) {
  if (state.status === 'loading') {
    return (
      <section className="dashboard-analytics" aria-label="Dashboard analytics">
        <LoadingState title="Loading analytics" description="Preparing dashboard charts..." />
      </section>
    );
  }

  if (state.status === 'error') {
    return (
      <section className="dashboard-analytics" aria-label="Dashboard analytics">
        <ErrorState title="Could not load analytics" description={state.message} />
      </section>
    );
  }

  const visibleSports = getVisibleSports(
    state.data.weeklySummary,
    state.data.sportDistribution,
  );

  return (
    <section className="dashboard-analytics" aria-label="Dashboard analytics">
      <div className="dashboard-analytics__head">
        <div>
          <p className="dashboard-analytics__eyebrow">Analytics</p>
          <h2>Training trends</h2>
        </div>
        <p>Last 8 weeks of volume and current 4-week sport distribution.</p>
      </div>

      <div className="dashboard-analytics__grid">
        <article className="dashboard-chart-card dashboard-chart-card--wide">
          <header>
            <div>
              <p>Weekly volume</p>
              <h3>Hours by sport</h3>
            </div>
            <span>8 weeks</span>
          </header>
          <WeeklyVolumeChart summary={state.data.weeklySummary} sports={visibleSports} />
        </article>

        <article className="dashboard-chart-card">
          <header>
            <div>
              <p>Sport distribution</p>
              <h3>Training time share</h3>
            </div>
            <span>4 weeks</span>
          </header>
          <SportDistributionChart distribution={state.data.sportDistribution} />
        </article>
      </div>
    </section>
  );
}
