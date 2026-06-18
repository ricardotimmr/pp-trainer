import { useState, type PointerEvent, type ReactNode } from 'react';

import {
  ErrorState,
  SourceBadge,
  SportBadge,
} from '../components';
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatPace,
  sourceLabels,
  sportLabels,
} from '../components/prototypeFormatters';
import { PageShell } from '../layout/PageShell';
import {
  getActivityById,
  getTrainingZones,
} from '../mock/prototypeData.helpers';
import type {
  Activity,
  ActivityStrengthExercise,
  ActivityStrengthSet,
  ActivitySwimLap,
  ActivityTimeSeriesSample,
  TimeInZone,
  TrainingZone,
} from '../mock/prototypeData.types';
import type { PageComponentProps } from '../routes/routeTypes';

type ChartMetric = {
  id: string;
  title: string;
  eyebrow: string;
  unit: string;
  color: string;
  getValue: (sample: ActivityTimeSeriesSample) => number | undefined;
  formatValue: (value: number) => string;
  invert?: boolean;
};

type DetailMetric = {
  label: string;
  value?: ReactNode;
  note?: ReactNode;
  accent?: boolean;
};

type ChartPoint = {
  offsetSeconds: number;
  value: number;
  x: number;
  y: number;
};

const hasValue = (value: unknown) => value !== undefined && value !== null;

const formatNumber = (value?: number, suffix = '') =>
  hasValue(value) ? `${value}${suffix}` : undefined;

const formatDecimal = (value?: number, digits = 1, suffix = '') =>
  hasValue(value) ? `${value.toFixed(digits)}${suffix}` : undefined;

const formatCalories = (value?: number) =>
  hasValue(value) ? `${value.toLocaleString('en')} kcal` : undefined;

const formatSpeed = (value?: number) =>
  hasValue(value) ? `${value.toFixed(1)} km/h` : undefined;

const formatMeters = (value?: number) =>
  hasValue(value) ? `${Math.round(value)} m` : undefined;

const formatWeight = (value?: number) =>
  hasValue(value) ? `${value.toLocaleString('en')} kg` : undefined;

const formatVolume = (value?: number) =>
  hasValue(value) ? `${value.toLocaleString('en')} kg` : undefined;

const formatSwimPace = (secondsPer100m?: number) => {
  if (!secondsPer100m) {
    return undefined;
  }

  const minutes = Math.floor(secondsPer100m / 60);
  const seconds = Math.round(secondsPer100m % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /100m`;
};

const formatActivityPace = (activity: Activity) => {
  if (!activity.averagePaceSecPerKm) {
    return undefined;
  }

  if (activity.sport === 'swimming') {
    return formatSwimPace(activity.averagePaceSecPerKm / 10);
  }

  return formatPace(activity.averagePaceSecPerKm);
};

const formatDateTime = (dateValue: string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue));

const formatClock = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = Math.round(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${restSeconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${restSeconds.toString().padStart(2, '0')}`;
};

const getSeriesValues = (
  samples: ActivityTimeSeriesSample[] | undefined,
  getValue: ChartMetric['getValue'],
) => {
  const valuesByOffset = new Map<number, { offsetSeconds: number; value: number }>();

  (samples ?? []).forEach((sample) => {
    const value = getValue(sample);

    if (value === undefined || !Number.isFinite(value)) {
      return;
    }

    valuesByOffset.set(sample.offsetSeconds, {
      offsetSeconds: sample.offsetSeconds,
      value,
    });
  });

  return [...valuesByOffset.values()].sort(
    (a, b) => a.offsetSeconds - b.offsetSeconds,
  );
};

const buildPath = (
  points: ChartPoint[],
) =>
  points
    .map((point, index) => {
      return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(' ');

const buildChartPoints = (
  values: { offsetSeconds: number; value: number }[],
  width: number,
  height: number,
  invert = false,
) => {
  if (values.length < 2) {
    return [];
  }

  const minX = values[0]?.offsetSeconds ?? 0;
  const maxX = values[values.length - 1]?.offsetSeconds ?? minX + 1;
  const rawValues = values.map((item) => item.value);
  const minY = Math.min(...rawValues);
  const maxY = Math.max(...rawValues);
  const yRange = maxY - minY || 1;
  const xRange = maxX - minX || 1;

  return values
    .map((item) => {
      const x = ((item.offsetSeconds - minX) / xRange) * width;
      const normalized = (item.value - minY) / yRange;
      const y = invert ? normalized * height : height - normalized * height;
      return {
        offsetSeconds: item.offsetSeconds,
        value: item.value,
        x,
        y,
      };
    });
};

function MetricStrip({ metrics }: { metrics: DetailMetric[] }) {
  return (
    <dl className="activity-detail-metrics">
      {metrics
        .filter((metric) => hasValue(metric.value))
        .map((metric) => (
          <div
            key={metric.label}
            className={metric.accent ? 'is-accent' : undefined}
          >
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
            {metric.note ? <span>{metric.note}</span> : null}
          </div>
        ))}
    </dl>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="activity-section-head">
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}

function TimeSeriesChart({
  activity,
  metric,
  variant = 'standard',
}: {
  activity: Activity;
  metric: ChartMetric;
  variant?: 'standard' | 'large';
}) {
  const values = getSeriesValues(activity.timeSeries, metric.getValue);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (values.length < 2) {
    return null;
  }

  const width = 640;
  const height = 180;
  const points = buildChartPoints(values, width, height, metric.invert);
  const path = buildPath(points);
  const rawValues = values.map((item) => item.value);
  const minValue = Math.min(...rawValues);
  const maxValue = Math.max(...rawValues);
  const lastValue = rawValues[rawValues.length - 1] ?? minValue;
  const hoveredPoint =
    hoveredIndex !== null ? points[hoveredIndex] : undefined;
  const tooltipAlignment = hoveredPoint
    ? hoveredPoint.x > width * 0.78
      ? 'is-left'
      : hoveredPoint.x < width * 0.22
        ? 'is-right'
        : ''
    : '';

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * width;
    const nextIndex = points.reduce((nearestIndex, point, index) => {
      const nearestDistance = Math.abs(points[nearestIndex].x - pointerX);
      const pointDistance = Math.abs(point.x - pointerX);
      return pointDistance < nearestDistance ? index : nearestIndex;
    }, 0);

    setHoveredIndex(nextIndex);
  };

  return (
    <article
      className={[
        'activity-chart',
        variant === 'large' ? 'activity-chart--large' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      key={metric.id}
    >
      <div className="activity-chart__top">
        <div>
          <p>{metric.eyebrow}</p>
          <h3>{metric.title}</h3>
        </div>
        <span>{metric.formatValue(lastValue)}</span>
      </div>
      <div className="activity-chart__plot-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="activity-chart__plot"
          role="img"
          aria-label={`${metric.title} time series`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredIndex(null)}
        >
          <line x1="0" x2={width} y1="1" y2="1" />
          <line x1="0" x2={width} y1={height / 2} y2={height / 2} />
          <line x1="0" x2={width} y1={height - 1} y2={height - 1} />
          <path
            d={path}
            fill="none"
            stroke={metric.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          {hoveredPoint ? (
            <g className="activity-chart__cursor">
              <line
                x1={hoveredPoint.x}
                x2={hoveredPoint.x}
                y1="0"
                y2={height}
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="6"
                fill={metric.color}
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="3"
                fill="#ffffff"
              />
            </g>
          ) : null}
        </svg>
        {hoveredPoint ? (
          <div
            className={[
              'activity-chart__tooltip',
              tooltipAlignment,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
            }}
          >
            <span>{formatClock(hoveredPoint.offsetSeconds)}</span>
            <strong>{metric.formatValue(hoveredPoint.value)}</strong>
          </div>
        ) : null}
      </div>
      <div className="activity-chart__scale">
        <span>
          {metric.invert ? 'Slow' : 'Min'}{' '}
          {metric.formatValue(metric.invert ? maxValue : minValue)}
        </span>
        <span>{formatDuration(activity.durationSeconds)}</span>
        <span>
          {metric.invert ? 'Fast' : 'Max'}{' '}
          {metric.formatValue(metric.invert ? minValue : maxValue)}
        </span>
      </div>
    </article>
  );
}

function ChartSection({ activity }: { activity: Activity }) {
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const isCycling = activity.sport === 'cycling';
  const isSwimming = activity.sport === 'swimming';
  const metrics: ChartMetric[] = [
    {
      id: 'heart-rate',
      title: 'Heart rate',
      eyebrow: 'Cardio load',
      unit: 'bpm',
      color: '#eb0f7a',
      getValue: (sample) => sample.heartRateBpm,
      formatValue: (value) => `${Math.round(value)} bpm`,
    },
    {
      id: 'pace',
      title: isCycling ? 'Speed' : isSwimming ? 'Swim pace' : 'Pace',
      eyebrow: isSwimming ? 'Pool rhythm' : 'Output rhythm',
      unit: isCycling ? 'km/h' : isSwimming ? '/100m' : '/km',
      color: '#f2641a',
      getValue: (sample) =>
        isCycling
          ? sample.speedKmh
          : isSwimming
            ? sample.swimPaceSecPer100m
            : sample.paceSecPerKm,
      formatValue: (value) =>
        isCycling
          ? `${value.toFixed(1)} km/h`
          : isSwimming
            ? (formatSwimPace(value) ?? 'n/a')
            : (formatPace(value) ?? 'n/a'),
      invert: !isCycling,
    },
    {
      id: 'elevation',
      title: 'Elevation',
      eyebrow: 'Course profile',
      unit: 'm',
      color: '#8c8a90',
      getValue: (sample) => sample.elevationMeters,
      formatValue: (value) => `${Math.round(value)} m`,
    },
    {
      id: 'power',
      title: 'Power',
      eyebrow: 'Mechanical load',
      unit: 'W',
      color: '#1a74e8',
      getValue: (sample) => sample.powerWatts,
      formatValue: (value) => `${Math.round(value)} W`,
    },
    {
      id: 'cadence',
      title: 'Cadence',
      eyebrow: 'Movement rate',
      unit: 'rpm',
      color: '#7c3aed',
      getValue: (sample) => sample.cadenceRpm,
      formatValue: (value) => `${Math.round(value)} rpm`,
    },
  ];

  const availableMetrics = metrics.filter(
    (metric) => getSeriesValues(activity.timeSeries, metric.getValue).length > 1,
  );
  const activeMetric =
    availableMetrics[Math.min(activeMetricIndex, availableMetrics.length - 1)] ??
    availableMetrics[0];
  const activeIndex = Math.min(
    activeMetricIndex,
    Math.max(availableMetrics.length - 1, 0),
  );
  const tabWidth = availableMetrics.length > 0 ? 100 / availableMetrics.length : 0;

  if (availableMetrics.length === 0) {
    return (
      <section className="activity-panel">
        <SectionHeader eyebrow="Time series" title="No chart stream captured" />
        <p className="activity-muted">
          This activity has summary data only. The detail page keeps moving and
          hides empty chart slots.
        </p>
      </section>
    );
  }

  return (
    <section className="activity-panel">
      <SectionHeader
        eyebrow="Time series"
        title="One signal at a time"
        action={<span>{availableMetrics.length} streams</span>}
      />
      <div
        className="activity-chart-tabs"
        role="tablist"
        aria-label="Activity chart streams"
      >
        <span
          className="activity-chart-tabs__indicator"
          style={{
            left: `calc(${activeIndex * tabWidth}% + 7px)`,
            width: `calc(${tabWidth}% - 14px)`,
          }}
          aria-hidden="true"
        />
        {availableMetrics.map((metric, index) => (
          <button
            key={metric.id}
            type="button"
            role="tab"
            aria-selected={activeMetric?.id === metric.id}
            className={activeMetric?.id === metric.id ? 'is-active' : undefined}
            onClick={() => setActiveMetricIndex(index)}
          >
            <span>{metric.title}</span>
            <small>{metric.unit}</small>
          </button>
        ))}
      </div>
      {activeMetric ? (
        <div className="activity-chart-stage">
          <TimeSeriesChart
            activity={activity}
            metric={activeMetric}
            variant="large"
          />
        </div>
      ) : null}
    </section>
  );
}

function ZoneDistributionBar({
  zones,
  title,
  eyebrow,
}: {
  zones?: TimeInZone[];
  title: string;
  eyebrow: string;
}) {
  const visibleZones = (zones ?? []).filter((zone) => zone.durationSeconds > 0);

  if (visibleZones.length === 0) {
    return null;
  }

  return (
    <section className="activity-panel">
      <SectionHeader eyebrow={eyebrow} title={title} />
      <div className="activity-zone-bar" aria-label={title}>
        {visibleZones.map((zone) => (
          <span
            key={`${zone.zoneNumber}-${zone.zoneName}`}
            className={`activity-zone-bar__segment activity-zone-bar__segment--z${zone.zoneNumber}`}
            style={{ width: `${Math.max(zone.percentage, 3)}%` }}
            title={`${zone.zoneName}: ${formatDuration(zone.durationSeconds)}`}
          />
        ))}
      </div>
      <div className="activity-zone-list">
        {visibleZones.map((zone) => (
          <div key={`${zone.zoneNumber}-${zone.zoneName}`}>
            <span
              className={`activity-zone-list__dot activity-zone-list__dot--z${zone.zoneNumber}`}
            />
            <strong>Z{zone.zoneNumber}</strong>
            <span>{zone.zoneName}</span>
            <em>{formatDuration(zone.durationSeconds)}</em>
            <small>{zone.percentage}%</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function SplitsTable({ activity }: { activity: Activity }) {
  if (activity.sport === 'swimming' && activity.swimLaps?.length) {
    return <SwimLapsTable laps={activity.swimLaps} />;
  }

  if (!activity.laps?.length) {
    return null;
  }

  return (
    <section className="activity-panel">
      <SectionHeader
        eyebrow="Splits"
        title={activity.sport === 'cycling' ? 'Laps by block' : 'Kilometer rhythm'}
        action={<span>{activity.laps.length} rows</span>}
      />
      <div className="activity-table-wrap">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Lap</th>
              <th>Distance</th>
              <th>Time</th>
              <th>{activity.sport === 'cycling' ? 'Speed' : 'Pace'}</th>
              <th>Avg HR</th>
              <th>Cadence</th>
              {activity.sport === 'cycling' ? <th>Power</th> : null}
              <th>Elev.</th>
            </tr>
          </thead>
          <tbody>
            {activity.laps.map((lap) => (
              <tr key={lap.lapNumber}>
                <td>{lap.lapNumber}</td>
                <td>{formatDistance(lap.distanceMeters)}</td>
                <td>{formatClock(lap.durationSeconds)}</td>
                <td>
                  {activity.sport === 'cycling'
                    ? formatSpeed(lap.averageSpeedKmh)
                    : formatPace(lap.averagePaceSecPerKm)}
                </td>
                <td>{formatNumber(lap.averageHeartRateBpm, ' bpm')}</td>
                <td>{formatNumber(lap.averageCadence, ' rpm')}</td>
                {activity.sport === 'cycling' ? (
                  <td>{formatNumber(lap.averagePowerWatts, ' W')}</td>
                ) : null}
                <td>{formatMeters(lap.elevationGainMeters) ?? 'n/a'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SwimLapsTable({ laps }: { laps: ActivitySwimLap[] }) {
  return (
    <section className="activity-panel">
      <SectionHeader
        eyebrow="Pool laps"
        title="Swim set breakdown"
        action={<span>{laps.length} × 100m</span>}
      />
      <div className="activity-table-wrap">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Lap</th>
              <th>Distance</th>
              <th>Time</th>
              <th>Pace</th>
              <th>Stroke</th>
              <th>Strokes</th>
              <th>SWOLF</th>
              <th>Avg HR</th>
            </tr>
          </thead>
          <tbody>
            {laps.map((lap) => (
              <tr key={lap.lapNumber}>
                <td>{lap.lapNumber}</td>
                <td>{formatDistance(lap.distanceMeters)}</td>
                <td>{formatClock(lap.durationSeconds)}</td>
                <td>{formatSwimPace(lap.averagePaceSecPer100m)}</td>
                <td>{lap.strokeType ?? 'n/a'}</td>
                <td>{formatNumber(lap.strokeCount)}</td>
                <td>{formatNumber(lap.swolfScore)}</td>
                <td>{formatNumber(lap.averageHeartRateBpm, ' bpm')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StrengthExerciseGrid({
  exercises,
}: {
  exercises?: ActivityStrengthExercise[];
}) {
  if (!exercises?.length) {
    return null;
  }

  return (
    <div className="activity-strength-exercises">
      {exercises.map((exercise) => (
        <article
          key={exercise.exerciseName}
          className="activity-strength-exercise"
        >
          <div>
            <p>{exercise.exerciseCategory ?? 'Exercise'}</p>
            <h3>{exercise.exerciseName}</h3>
          </div>
          <dl>
            <div>
              <dt>Sets</dt>
              <dd>{exercise.sets}</dd>
            </div>
            <div>
              <dt>Reps</dt>
              <dd>{formatNumber(exercise.reps) ?? 'n/a'}</dd>
            </div>
            <div>
              <dt>Best</dt>
              <dd>{formatWeight(exercise.bestWeightKg) ?? 'n/a'}</dd>
            </div>
          </dl>
          {exercise.muscleGroup ? <span>{exercise.muscleGroup}</span> : null}
        </article>
      ))}
    </div>
  );
}

function StrengthSetsTable({ sets }: { sets?: ActivityStrengthSet[] }) {
  if (!sets?.length) {
    return (
      <section className="activity-panel">
        <SectionHeader eyebrow="Strength" title="Set details unavailable" />
        <p className="activity-muted">
          This strength file has summary data only. Exercise and set details will
          appear here when the source provides them.
        </p>
      </section>
    );
  }

  return (
    <section className="activity-panel">
      <SectionHeader
        eyebrow="Strength sets"
        title="Set breakdown"
        action={<span>{sets.length} sets</span>}
      />
      <div className="activity-table-wrap">
        <table className="activity-table activity-table--strength">
          <thead>
            <tr>
              <th>Set</th>
              <th>Exercise</th>
              <th>Category</th>
              <th>Reps</th>
              <th>Load</th>
              <th>Duration</th>
              <th>Rest</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set, index) => (
              <tr
                key={
                  set.id ??
                  set.externalSetId ??
                  `${set.setNumber}-${set.exerciseName ?? 'unknown'}-${index}`
                }
              >
                <td>{set.setNumber}</td>
                <td>{set.exerciseName ?? 'Unknown exercise'}</td>
                <td>{set.exerciseCategory ?? 'n/a'}</td>
                <td>{formatNumber(set.reps) ?? 'n/a'}</td>
                <td>{formatWeight(set.weightKg) ?? 'n/a'}</td>
                <td>
                  {hasValue(set.durationSeconds)
                    ? formatClock(set.durationSeconds)
                    : 'n/a'}
                </td>
                <td>
                  {hasValue(set.restSeconds)
                    ? formatClock(set.restSeconds)
                    : 'n/a'}
                </td>
                <td>{set.notes ?? 'n/a'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StrengthDetailSection({ activity }: { activity: Activity }) {
  return (
    <>
      <section className="activity-panel">
        <SectionHeader
          eyebrow="Strength file"
          title="Exercise overview"
          action={
            activity.strengthExercises?.length ? (
              <span>{activity.strengthExercises.length} exercises</span>
            ) : undefined
          }
        />
        <MetricStrip
          metrics={[
            {
              label: 'Total sets',
              value: formatNumber(activity.totalSets),
              accent: true,
            },
            {
              label: 'Total reps',
              value: formatNumber(activity.totalReps),
            },
            {
              label: 'Volume',
              value: formatVolume(activity.totalVolumeKg),
            },
            {
              label: 'Avg HR',
              value: formatNumber(activity.averageHeartRateBpm, ' bpm'),
            },
            {
              label: 'Max HR',
              value: formatNumber(activity.maxHeartRateBpm, ' bpm'),
            },
            {
              label: 'RPE',
              value: formatNumber(activity.perceivedExertion, '/10'),
            },
          ]}
        />
        <StrengthExerciseGrid exercises={activity.strengthExercises} />
      </section>
      <StrengthSetsTable sets={activity.strengthSets} />
    </>
  );
}

function getPowerZoneDistribution(
  activity: Activity,
  powerZones: TrainingZone[],
): TimeInZone[] {
  if (!activity.timeSeries?.length || powerZones.length === 0) {
    return [];
  }

  const durations = new Map<number, number>();

  activity.timeSeries.forEach((sample, index) => {
    const powerWatts = sample.powerWatts;

    if (powerWatts === undefined) {
      return;
    }

    const next = activity.timeSeries?.[index + 1];
    const duration = next
      ? next.offsetSeconds - sample.offsetSeconds
      : activity.timeSeries?.[index]?.offsetSeconds
        ? activity.timeSeries[index].offsetSeconds -
          (activity.timeSeries[index - 1]?.offsetSeconds ?? 0)
        : 60;
    const zone =
      powerZones.find((item) => {
        const lower = item.lowerBound ?? Number.NEGATIVE_INFINITY;
        const upper = item.upperBound ?? Number.POSITIVE_INFINITY;
        return powerWatts >= lower && powerWatts <= upper;
      }) ?? powerZones[powerZones.length - 1];

    if (!zone) {
      return;
    }

    durations.set(
      zone.zoneNumber,
      (durations.get(zone.zoneNumber) ?? 0) + Math.max(duration, 0),
    );
  });

  const total = [...durations.values()].reduce((sum, value) => sum + value, 0);

  if (total <= 0) {
    return [];
  }

  return powerZones.map((zone) => {
    const durationSeconds = durations.get(zone.zoneNumber) ?? 0;

    return {
      zoneNumber: zone.zoneNumber,
      zoneName: zone.name,
      durationSeconds,
      percentage: Math.round((durationSeconds / total) * 100),
    };
  });
}

function SportSpecificSection({ activity }: { activity: Activity }) {
  if (activity.sport === 'cycling') {
    const powerZones = getTrainingZones().filter(
      (zone) => zone.trainingZoneSetId === 'zone-set-cycling-power',
    );
    const powerZoneDistribution = getPowerZoneDistribution(activity, powerZones);

    return (
      <section className="activity-sport-grid">
        <div className="activity-panel">
          <SectionHeader eyebrow="Cycling" title="Power file" />
          <MetricStrip
            metrics={[
              {
                label: 'Normalized power',
                value: formatNumber(activity.normalizedPowerWatts, ' W'),
                accent: true,
              },
              {
                label: 'Intensity factor',
                value: formatDecimal(activity.intensityFactor, 2),
              },
              {
                label: 'Training stress',
                value: formatDecimal(activity.trainingStressScore, 0),
                note: 'TSS',
              },
              {
                label: 'Max power',
                value: formatNumber(activity.maxPowerWatts, ' W'),
              },
            ]}
          />
        </div>
        <ZoneDistributionBar
          zones={powerZoneDistribution}
          eyebrow="Cycling power"
          title="Power zone distribution"
        />
      </section>
    );
  }

  if (activity.sport === 'running') {
    return (
      <section className="activity-panel">
        <SectionHeader eyebrow="Running" title="Run mechanics" />
        <MetricStrip
          metrics={[
            {
              label: 'Avg cadence',
              value: formatNumber(activity.averageCadence, ' rpm'),
              accent: true,
            },
            {
              label: 'Best pace',
              value: formatPace(activity.bestPaceSecPerKm),
            },
            {
              label: 'Ground contact',
              value: 'n/a',
              note: 'Ready when source provides it',
            },
            {
              label: 'Elevation gain',
              value: formatMeters(activity.elevationGainMeters),
            },
          ]}
        />
      </section>
    );
  }

  if (activity.sport === 'swimming') {
    return (
      <section className="activity-panel">
        <SectionHeader eyebrow="Swimming" title="Pool efficiency" />
        <MetricStrip
          metrics={[
            {
              label: 'Pool length',
              value: formatMeters(activity.poolLengthMeters),
            },
            {
              label: 'SWOLF',
              value: formatNumber(activity.avgSwolfScore),
              accent: true,
            },
            {
              label: 'Strokes',
              value: formatNumber(activity.totalStrokeCount),
            },
            {
              label: 'Stroke type',
              value: activity.dominantStrokeType,
            },
          ]}
        />
      </section>
    );
  }

  if (activity.sport === 'strength') {
    const primaryMuscleGroups = [
      ...new Set(
        activity.strengthExercises
          ?.map((exercise) => exercise.muscleGroup)
          .filter((muscleGroup): muscleGroup is string => Boolean(muscleGroup)) ??
          [],
      ),
    ];

    return (
      <section className="activity-panel">
        <SectionHeader eyebrow="Strength" title="Session load" />
        <MetricStrip
          metrics={[
            {
              label: 'Exercises',
              value: formatNumber(activity.strengthExercises?.length),
              accent: true,
            },
            {
              label: 'Sets',
              value: formatNumber(activity.totalSets),
            },
            {
              label: 'Volume',
              value: formatVolume(activity.totalVolumeKg),
            },
          ]}
        />
        {primaryMuscleGroups.length ? (
          <div className="activity-strength-tags" aria-label="Muscle groups">
            {primaryMuscleGroups.map((muscleGroup) => (
              <span key={muscleGroup}>{muscleGroup}</span>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  return null;
}

function SourceMetadata({ activity }: { activity: Activity }) {
  return (
    <section className="activity-panel activity-panel--metadata">
      <SectionHeader eyebrow="Source" title="Metadata" />
      <dl className="activity-metadata">
        <div>
          <dt>Source</dt>
          <dd>{sourceLabels[activity.sourceType]}</dd>
        </div>
        {activity.externalId ? (
          <div>
            <dt>External ID</dt>
            <dd>{activity.externalId}</dd>
          </div>
        ) : null}
        {activity.timezone ? (
          <div>
            <dt>Timezone</dt>
            <dd>{activity.timezone}</dd>
          </div>
        ) : null}
        <div>
          <dt>Created</dt>
          <dd>{formatDateTime(activity.createdAt)}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatDateTime(activity.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function ActivityDetailPage({ params, navigate }: PageComponentProps) {
  const activity = params.id ? getActivityById(params.id) : undefined;

  if (!activity) {
    return (
      <PageShell
        title="Activity not found"
        eyebrow="Activity detail"
        description="The requested activity does not exist in the current prototype data."
        actions={
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate('/activities')}
          >
            Back to activities
          </button>
        }
      >
        <ErrorState
          title="Unknown activity"
          description={
            <>
              No mock activity was found for ID <strong>{params.id}</strong>.
            </>
          }
        />
      </PageShell>
    );
  }

  const baseKeyMetrics: DetailMetric[] = [
    {
      label: 'Duration',
      value: formatDuration(activity.durationSeconds),
      note: activity.movingDurationSeconds
        ? `${formatDuration(activity.movingDurationSeconds)} moving`
        : undefined,
      accent: true,
    },
    {
      label: 'Avg HR',
      value: formatNumber(activity.averageHeartRateBpm, ' bpm'),
    },
    {
      label: 'Max HR',
      value: formatNumber(activity.maxHeartRateBpm, ' bpm'),
    },
    {
      label: 'Calories',
      value: formatCalories(activity.calories),
    },
  ];
  const keyMetrics: DetailMetric[] =
    activity.sport === 'strength'
      ? [
          ...baseKeyMetrics,
          {
            label: 'Sets',
            value: formatNumber(activity.totalSets),
          },
          {
            label: 'Volume',
            value: formatVolume(activity.totalVolumeKg),
          },
        ]
      : [
          baseKeyMetrics[0],
          {
            label: 'Distance',
            value: formatDistance(activity.distanceMeters),
          },
          ...baseKeyMetrics.slice(1),
          {
            label: activity.sport === 'cycling' ? 'Avg power' : 'Avg pace',
            value:
              activity.sport === 'cycling'
                ? formatNumber(activity.averagePowerWatts, ' W')
                : formatActivityPace(activity),
          },
        ];

  return (
    <PageShell
      title={activity.title ?? 'Activity Detail'}
      eyebrow={`${sportLabels[activity.sport]} · ${formatDate(activity.startTime)}`}
      description={
        <>
          Complete activity file from {sourceLabels[activity.sourceType]} data.
          The view is built for python-garminconnect depth: samples,
          splits, zones and sport-specific metrics.
        </>
      }
      actions={
        <button
          type="button"
          className="button button--secondary"
          onClick={() => navigate('/activities')}
        >
          Back to activities
        </button>
      }
    >
      <article className="activity-detail-page">
        <section className="activity-detail-hero">
          <div className="activity-detail-hero__identity">
            <div className="badge-row">
              <SportBadge sport={activity.sport} />
              <SourceBadge source={activity.sourceType} />
            </div>
            <p>{formatDateTime(activity.startTime)}</p>
            <h2>{sportLabels[activity.sport]} analysis</h2>
          </div>
          <MetricStrip metrics={keyMetrics} />
        </section>

        <div className="activity-detail-layout">
          <main className="activity-detail-main">
            {activity.sport === 'strength' ? (
              <StrengthDetailSection activity={activity} />
            ) : (
              <>
                <ChartSection activity={activity} />
                <SplitsTable activity={activity} />
              </>
            )}
          </main>

          <aside className="activity-detail-side" aria-label="Activity context">
            <ZoneDistributionBar
              zones={activity.timeInHrZones}
              eyebrow="Heart rate"
              title="Time in zones"
            />
            <SportSpecificSection activity={activity} />
            {activity.notes ? (
              <section className="activity-panel">
                <SectionHeader eyebrow="Notes" title="Athlete context" />
                <p className="activity-copy">{activity.notes}</p>
              </section>
            ) : null}
            <SourceMetadata activity={activity} />
          </aside>
        </div>
      </article>
    </PageShell>
  );
}
