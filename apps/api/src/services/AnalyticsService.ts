import type { SportType } from '@prisma/client';
import type {
  SportDistributionDto,
  WeeklySummaryDto,
  WeeklySummarySportBreakdownDto,
} from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import { SPORT_TYPE_MAP } from '../mappers/enumMaps.js';
import type { ActivityForAnalytics } from '../repositories/ActivityRepository.js';
import * as ActivityRepository from '../repositories/ActivityRepository.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(value: string, fieldName: string): Date {
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw ApiError.badRequest(`${fieldName} must be a valid YYYY-MM-DD date`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || toDateOnly(date) !== value) {
    throw ApiError.badRequest(`${fieldName} must be a valid YYYY-MM-DD date`);
  }

  return date;
}

function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function getIsoWeekStart(date: Date): Date {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysFromMonday);
  return start;
}

function addWeeks(date: Date, weeks: number): Date {
  return new Date(date.getTime() + weeks * WEEK_MS);
}

function addSportSeconds(
  map: Map<SportType, number>,
  sport: SportType,
  durationSeconds: number,
): void {
  map.set(sport, (map.get(sport) ?? 0) + durationSeconds);
}

function toSportBreakdown(items: Map<SportType, number>): WeeklySummarySportBreakdownDto[] {
  return [...items.entries()]
    .filter(([, seconds]) => seconds > 0)
    .map(([sport, seconds]) => ({
      sport: SPORT_TYPE_MAP[sport],
      seconds,
    }));
}

export function getWeeklyWindow(weeks: number, now = new Date()): {
  fromDate: Date;
  toDate: Date;
  weekStarts: Date[];
} {
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 26) {
    throw ApiError.badRequest('weeks must be an integer between 1 and 26');
  }

  const currentWeekStart = getIsoWeekStart(now);
  const firstWeekStart = addWeeks(currentWeekStart, -(weeks - 1));
  const weekStarts = Array.from({ length: weeks }, (_, index) => addWeeks(firstWeekStart, index));
  const toDate = new Date(addWeeks(currentWeekStart, 1).getTime() - 1);

  return { fromDate: firstWeekStart, toDate, weekStarts };
}

export function buildWeeklySummaries(
  activities: ActivityForAnalytics[],
  weekStarts: Date[],
): WeeklySummaryDto[] {
  if (activities.length === 0) return [];

  const grouped = new Map<string, Map<SportType, number>>();

  for (const activity of activities) {
    const weekStart = toDateOnly(getIsoWeekStart(activity.startTime));
    if (!grouped.has(weekStart)) grouped.set(weekStart, new Map());
    addSportSeconds(grouped.get(weekStart)!, activity.sport, activity.durationSeconds);
  }

  return weekStarts.map((weekStartDate) => {
    const weekStart = toDateOnly(weekStartDate);
    const bySportMap = grouped.get(weekStart) ?? new Map<SportType, number>();
    const bySport = toSportBreakdown(bySportMap);
    const totalSeconds = bySport.reduce((sum, item) => sum + item.seconds, 0);

    return {
      weekStart,
      totalSeconds,
      bySport,
    };
  });
}

export function buildSportDistribution(
  activities: ActivityForAnalytics[],
): SportDistributionDto[] {
  const grouped = new Map<SportType, { activityCount: number; totalSeconds: number }>();

  for (const activity of activities) {
    const current = grouped.get(activity.sport) ?? { activityCount: 0, totalSeconds: 0 };
    current.activityCount += 1;
    current.totalSeconds += activity.durationSeconds;
    grouped.set(activity.sport, current);
  }

  return [...grouped.entries()].map(([sport, values]) => ({
    sport: SPORT_TYPE_MAP[sport],
    activityCount: values.activityCount,
    totalSeconds: values.totalSeconds,
  }));
}

export async function getWeeklySummaries(
  athleteProfileId: string,
  weeks: number,
): Promise<WeeklySummaryDto[]> {
  const { fromDate, toDate, weekStarts } = getWeeklyWindow(weeks);
  const activities = await ActivityRepository.findActivitiesForAnalytics(
    athleteProfileId,
    fromDate,
    toDate,
  );
  return buildWeeklySummaries(activities, weekStarts);
}

export async function getCurrentAthleteWeeklySummaries(
  weeks: number,
): Promise<WeeklySummaryDto[]> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) return [];
  return getWeeklySummaries(profile.id, weeks);
}

export async function getSportDistribution(
  athleteProfileId: string,
  from: string,
  to: string,
): Promise<SportDistributionDto[]> {
  const fromDate = parseDateOnly(from, 'from');
  const toStart = parseDateOnly(to, 'to');
  if (fromDate.getTime() > toStart.getTime()) {
    throw ApiError.badRequest('from must be before or equal to to');
  }

  const activities = await ActivityRepository.findActivitiesForAnalytics(
    athleteProfileId,
    fromDate,
    endOfUtcDay(toStart),
  );

  return buildSportDistribution(activities);
}

export async function getCurrentAthleteSportDistribution(
  from: string,
  to: string,
): Promise<SportDistributionDto[]> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) return [];
  return getSportDistribution(profile.id, from, to);
}
