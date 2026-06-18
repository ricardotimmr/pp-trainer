import type {
  Activity,
  DataSourceType,
  GoalPriority,
  SportType,
  WorkoutIntensity,
} from '../mock/prototypeData.types';

export const sportLabels: Record<SportType, string> = {
  cycling: 'Cycling',
  running: 'Running',
  swimming: 'Swimming',
  strength: 'Strength',
  mobility: 'Mobility',
  other: 'Other',
};

export const intensityLabels: Record<WorkoutIntensity, string> = {
  rest: 'Rest',
  recovery: 'Recovery',
  easy: 'Easy',
  moderate: 'Moderate',
  tempo: 'Tempo',
  threshold: 'Threshold',
  vo2max: 'VO2 Max',
  race: 'Race',
  strength: 'Strength',
};

export const sourceLabels: Record<DataSourceType, string> = {
  mock: 'Mock',
  manual_fit_upload: 'FIT Upload',
  manual_gpx_upload: 'GPX Upload',
  manual_tcx_upload: 'TCX Upload',
  manual_json_import: 'JSON Import',
  manual_csv_import: 'CSV Import',
  garmin_official: 'Garmin',
  garmin_unofficial: 'Garmin Unofficial',
  garmin_export: 'Garmin Export',
  strava: 'Strava',
  aggregator: 'Aggregator',
};

export const goalPriorityLabels: Record<GoalPriority, string> = {
  main_goal: 'Main goal',
  secondary_goal: 'Secondary goal',
  watchlist: 'Watchlist',
};

export const formatDate = (dateValue: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(dateValue));

export const formatDuration = (seconds?: number) => {
  if (!seconds) {
    return 'n/a';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
};

export const formatDistance = (meters?: number) => {
  if (!meters) {
    return 'n/a';
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
};

export const formatPace = (secondsPerKm?: number) => {
  if (!secondsPerKm) {
    return undefined;
  }

  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
};

export const getActivityPrimaryMetric = (activity: Activity) => {
  if (activity.averagePowerWatts) {
    return `${activity.averagePowerWatts} W`;
  }

  const pace = formatPace(activity.averagePaceSecPerKm);

  if (pace) {
    return pace;
  }

  if (activity.averageHeartRateBpm) {
    return `${activity.averageHeartRateBpm} bpm`;
  }

  return 'Source ready';
};
