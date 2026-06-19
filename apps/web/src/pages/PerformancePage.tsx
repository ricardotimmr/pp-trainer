import { SportBadge, ZoneBand, ZoneList } from '../components';
import {
  formatPace,
  sportLabels,
} from '../components/prototypeFormatters';
import { PageShell } from '../layout/PageShell';
import {
  getPerformanceRacePredictionsBySport,
  getPerformanceStats,
  getTrainingZonesBySetId,
  getTrainingZoneSetsBySport,
} from '../mock/prototypeData.helpers';
import type {
  RacePrediction,
  SportType,
  TrainingZone,
  TrainingZoneSet,
} from '../mock/prototypeData.types';

type PerformanceSport = 'running' | 'cycling' | 'swimming';

type PerformanceMetricProps = {
  label: string;
  value?: string;
  date?: string;
  accent?: boolean;
};

type SportSection = {
  sport: PerformanceSport;
  title: string;
  summary: string;
  metrics: PerformanceMetricProps[];
  zoneSets: TrainingZoneSet[];
  predictions: RacePrediction[];
};

function formatDate(date?: string): string {
  if (!date) return 'No measurement';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function formatSwimPace(secondsPer100m?: number): string | undefined {
  if (!secondsPer100m) return undefined;

  const minutes = Math.floor(secondsPer100m / 60);
  const seconds = Math.round(secondsPer100m % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /100m`;
}

function formatHeartRate(heartRateBpm?: number): string | undefined {
  return heartRateBpm ? `${heartRateBpm} bpm` : undefined;
}

function formatPower(powerWatts?: number): string | undefined {
  return powerWatts ? `${powerWatts} W` : undefined;
}

function formatRaceTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getPredictedSwimPace(prediction: RacePrediction): string | undefined {
  if (prediction.sport !== 'swimming' || prediction.distanceMeters <= 0) {
    return undefined;
  }

  return formatSwimPace(
    prediction.predictedDurationSeconds / (prediction.distanceMeters / 100),
  );
}

function getZoneSetTitle(zoneSet: TrainingZoneSet): string {
  if (zoneSet.zoneType === 'heart_rate') return 'Heart rate zones';
  if (zoneSet.zoneType === 'cycling_power') return 'Power zones';
  if (zoneSet.zoneType === 'running_pace') return 'Running pace zones';
  if (zoneSet.zoneType === 'swimming_pace') return 'Swimming pace zones';
  return zoneSet.name;
}

function PerformanceMetric({ label, value, date, accent }: PerformanceMetricProps) {
  return (
    <div className={accent ? 'performance-metric is-accent' : 'performance-metric'}>
      <dt>{label}</dt>
      <dd>{value ?? 'n/a'}</dd>
      <span>{formatDate(date)}</span>
    </div>
  );
}

function ZoneBar({ zoneSet, zones }: { zoneSet: TrainingZoneSet; zones: TrainingZone[] }) {
  if (zones.length === 0) {
    return (
      <div className="performance-empty">
        <p>No zone data available for {zoneSet.name}.</p>
      </div>
    );
  }

  return (
    <article className="performance-zone-card">
      <div className="performance-zone-card__head">
        <div>
          <p>{getZoneSetTitle(zoneSet)}</p>
          <h4>{zoneSet.name}</h4>
        </div>
        {zoneSet.basedOn ? <span>{zoneSet.basedOn}</span> : null}
      </div>
      <ZoneBand zones={zones} className="performance-zone-band" />
      <ZoneList
        zones={zones}
        className="performance-zone-list"
        rowClassName="performance-zone-row"
        dotClassName="performance-zone-row__dot"
        numberClassName="performance-zone-row__num"
        nameClassName="performance-zone-row__name"
        rangeClassName="performance-zone-row__range"
      />
    </article>
  );
}

function RacePredictor({ prediction }: { prediction: RacePrediction }) {
  const secondary =
    prediction.predictedPaceSecPerKm
      ? formatPace(prediction.predictedPaceSecPerKm)
      : prediction.predictedSpeedKmh
        ? `${prediction.predictedSpeedKmh.toFixed(1)} km/h`
        : getPredictedSwimPace(prediction);

  return (
    <article className="race-predictor">
      <p>Garmin estimate</p>
      <h4>{prediction.distanceLabel}</h4>
      <strong>{formatRaceTime(prediction.predictedDurationSeconds)}</strong>
      <span>{secondary ?? formatDate(prediction.estimatedAt)}</span>
      <time dateTime={prediction.estimatedAt}>
        Estimated {formatDate(prediction.estimatedAt)}
      </time>
    </article>
  );
}

export function PerformancePage() {
  const performanceStats = getPerformanceStats();
  const runningStats = performanceStats.bySport.running;
  const cyclingStats = performanceStats.bySport.cycling;
  const swimmingStats = performanceStats.bySport.swimming;

  const sportSections: SportSection[] = [
    {
      sport: 'running',
      title: 'Running',
      summary: 'Garmin running estimates for aerobic fitness, threshold pace and race outcomes.',
      metrics: [
        {
          label: 'VO2 max',
          value: runningStats?.vo2maxEstimate?.toFixed(1),
          date: runningStats?.vo2maxEstimatedAt,
          accent: true,
        },
        {
          label: 'Threshold HR',
          value: formatHeartRate(runningStats?.thresholdHeartRateBpm),
          date: runningStats?.thresholdHeartRateEstimatedAt,
        },
        {
          label: 'Threshold pace',
          value: formatPace(runningStats?.thresholdPaceSecPerKm),
          date: runningStats?.thresholdPaceEstimatedAt,
        },
      ],
      zoneSets: getTrainingZoneSetsBySport('running'),
      predictions: getPerformanceRacePredictionsBySport('running'),
    },
    {
      sport: 'cycling',
      title: 'Roadbike',
      summary: 'Cycling context for FTP, heart-rate behavior and time-trial readiness.',
      metrics: [
        {
          label: 'VO2 max',
          value: cyclingStats?.vo2maxEstimate?.toFixed(1),
          date: cyclingStats?.vo2maxEstimatedAt,
          accent: true,
        },
        {
          label: 'Threshold HR',
          value: formatHeartRate(cyclingStats?.thresholdHeartRateBpm),
          date: cyclingStats?.thresholdHeartRateEstimatedAt,
        },
        {
          label: 'FTP',
          value: formatPower(cyclingStats?.ftpWatts),
          date: cyclingStats?.ftpEstimatedAt,
        },
      ],
      zoneSets: getTrainingZoneSetsBySport('cycling'),
      predictions: getPerformanceRacePredictionsBySport('cycling'),
    },
    {
      sport: 'swimming',
      title: 'Swimming',
      summary: 'Pool and open-water benchmarks for threshold pace and estimated race efforts.',
      metrics: [
        {
          label: 'Threshold HR',
          value: formatHeartRate(swimmingStats?.thresholdHeartRateBpm),
          date: swimmingStats?.thresholdHeartRateEstimatedAt,
          accent: true,
        },
        {
          label: 'Threshold pace',
          value: formatSwimPace(swimmingStats?.thresholdPaceSecPer100m),
          date: swimmingStats?.thresholdPaceEstimatedAt,
        },
      ],
      zoneSets: getTrainingZoneSetsBySport('swimming'),
      predictions: getPerformanceRacePredictionsBySport('swimming'),
    },
  ];

  return (
    <PageShell
      title="Performance"
      eyebrow="Garmin benchmarks · Athlete context"
      description="Sport-specific performance stats derived from Garmin-style data and normalized into the athlete context used by the AI Coach."
    >
      <div className="performance-page">
        <section className="performance-overview">
          <div>
            <p className="performance-section-label">Latest model update</p>
            <h2>{formatDate(performanceStats.updatedAt)}</h2>
          </div>
          <p>
            VO2 max, thresholds, zones and race predictors stay visible here so
            raw Garmin imports become coaching context instead of isolated files.
          </p>
        </section>

        {sportSections.map((section) => (
          <section key={section.sport} className="performance-sport-section">
            <header className="performance-sport-section__head">
              <div>
                <SportBadge sport={section.sport as SportType} />
                <h2>{section.title}</h2>
                <p>{section.summary}</p>
              </div>
            </header>

            <dl className="performance-metric-grid">
              {section.metrics.map((metric) => (
                <PerformanceMetric key={metric.label} {...metric} />
              ))}
            </dl>

            <div className="performance-zone-grid">
              {section.zoneSets.length > 0 ? (
                section.zoneSets.map((zoneSet) => (
                  <ZoneBar
                    key={zoneSet.id}
                    zoneSet={zoneSet}
                    zones={getTrainingZonesBySetId(zoneSet.id)}
                  />
                ))
              ) : (
                <div className="performance-empty">
                  <p>No zone data available for {sportLabels[section.sport]}.</p>
                </div>
              )}
            </div>

            <div className="performance-predictors">
              <div className="performance-predictors__head">
                <p className="performance-section-label">Race predictors</p>
                <span>Garmin estimates</span>
              </div>
              {section.predictions.length > 0 ? (
                <div className="race-predictor-grid">
                  {section.predictions.map((prediction) => (
                    <RacePredictor
                      key={`${section.sport}-${prediction.distanceLabel}`}
                      prediction={prediction}
                    />
                  ))}
                </div>
              ) : (
                <div className="performance-empty">
                  <p>No race predictor data available for {sportLabels[section.sport]}.</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
