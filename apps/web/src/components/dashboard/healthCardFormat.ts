import type { HealthRange } from '../../hooks/useHealthRange';

export const HEALTH_RANGE_OPTIONS: HealthRange[] = ['7d', '14d', '30d'];

export function formatDayLabel(dateValue: string): string {
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(dateValue));
}

export function formatShortDate(dateValue: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(dateValue));
}

export function formatHoursFromSeconds(seconds?: number): string {
  if (seconds == null) return 'n/a';
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function average(values: (number | undefined)[]): number | undefined {
  const valid = values.filter((value): value is number => value != null);
  if (valid.length === 0) return undefined;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function formatNumber(value?: number, suffix = ''): string {
  if (value == null) return 'n/a';
  return `${Math.round(value).toLocaleString('en')}${suffix}`;
}
