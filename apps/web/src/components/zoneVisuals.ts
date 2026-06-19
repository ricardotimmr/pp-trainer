import type {
  TrainingZone,
  TrainingZoneUnit,
} from '../mock/prototypeData.types';

export const ZONE_COLORS = [
  'var(--color-int-recovery)',
  'var(--color-int-easy)',
  'var(--color-int-moderate)',
  'var(--color-int-threshold)',
  'var(--color-int-vo2max)',
];

export function getZoneColor(index: number): string {
  return ZONE_COLORS[index] ?? 'var(--color-muted)';
}

export function formatZonePaceShort(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatZoneValue(
  value?: number,
  unit?: TrainingZoneUnit,
): string {
  if (value === undefined) return '?';
  if (unit === 'sec_per_km' || unit === 'sec_per_100m') {
    return formatZonePaceShort(value);
  }
  return `${value}`;
}

export function formatZoneRange(
  lower?: number,
  upper?: number,
  unit?: TrainingZoneUnit,
): string {
  if (lower === undefined && upper === undefined) return '—';

  const range = `${formatZoneValue(lower, unit)} – ${formatZoneValue(upper, unit)}`;

  if (unit === 'bpm') return `${range} bpm`;
  if (unit === 'watts') return `${range} W`;
  if (unit === 'sec_per_km') return `${range} /km`;
  if (unit === 'sec_per_100m') return `${range} /100m`;
  return range;
}

export function formatTrainingZoneRange(zone: TrainingZone): string {
  return formatZoneRange(zone.lowerBound, zone.upperBound, zone.unit);
}

export function sortZonesByNumber(zones: TrainingZone[]): TrainingZone[] {
  return [...zones].sort((first, second) => first.zoneNumber - second.zoneNumber);
}
