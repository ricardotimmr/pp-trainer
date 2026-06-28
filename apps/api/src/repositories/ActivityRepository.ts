import type {
  Activity,
  ActivityLap,
  ActivityMetricSample,
  ActivityStrengthExercise,
  ActivityStrengthSet,
  ActivitySwimLap,
  ActivityTimeInZone,
  SportType,
} from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type ActivityWithDetails = Activity & {
  laps: ActivityLap[];
  swimLaps: ActivitySwimLap[];
  metricSamples: ActivityMetricSample[];
  timeInZones: ActivityTimeInZone[];
  strengthSets: ActivityStrengthSet[];
  strengthExercises: ActivityStrengthExercise[];
};

export type ActivityListFilters = {
  sport?: SportType;
  startTimeFrom?: Date;
  startTimeTo?: Date;
};

export async function findActivities(
  athleteProfileId: string,
  filters: ActivityListFilters = {},
  limit?: number,
): Promise<Activity[]> {
  return prisma.activity.findMany({
    where: {
      athleteProfileId,
      ...(filters.sport != null && { sport: filters.sport }),
      ...((filters.startTimeFrom != null || filters.startTimeTo != null) && {
        startTime: {
          ...(filters.startTimeFrom != null && { gte: filters.startTimeFrom }),
          ...(filters.startTimeTo != null && { lte: filters.startTimeTo }),
        },
      }),
    },
    orderBy: { startTime: 'desc' },
    ...(limit != null && { take: limit }),
  });
}

export type SimilarActivityParams = {
  athleteProfileId: string;
  sport: SportType;
  startTime: Date;
  durationSeconds: number;
};

export type ActivityForAnalytics = Pick<
  Activity,
  'sport' | 'startTime' | 'durationSeconds'
>;

export async function countActivitiesAllTime(athleteProfileId: string): Promise<number> {
  return prisma.activity.count({ where: { athleteProfileId } });
}

export async function findActivitiesForAnalytics(
  athleteProfileId: string,
  fromDate: Date,
  toDate: Date,
): Promise<ActivityForAnalytics[]> {
  return prisma.activity.findMany({
    where: {
      athleteProfileId,
      startTime: {
        gte: fromDate,
        lte: toDate,
      },
    },
    select: {
      sport: true,
      startTime: true,
      durationSeconds: true,
    },
    orderBy: { startTime: 'asc' },
  });
}

export async function findActivitiesForHistory(
  athleteProfileId: string,
  fromDate: Date,
): Promise<Pick<Activity, 'sport' | 'startTime' | 'durationSeconds' | 'distanceMeters'>[]> {
  return prisma.activity.findMany({
    where: { athleteProfileId, startTime: { gte: fromDate } },
    select: { sport: true, startTime: true, durationSeconds: true, distanceMeters: true },
    orderBy: { startTime: 'asc' },
  });
}

export async function findSimilarActivity(
  params: SimilarActivityParams,
): Promise<Pick<Activity, 'id'> | null> {
  const { athleteProfileId, sport, startTime, durationSeconds } = params;
  const windowMs = 30 * 1000;
  const durationLower = Math.floor(durationSeconds * 0.95);
  const durationUpper = Math.ceil(durationSeconds * 1.05);

  return prisma.activity.findFirst({
    where: {
      athleteProfileId,
      sport,
      startTime: {
        gte: new Date(startTime.getTime() - windowMs),
        lte: new Date(startTime.getTime() + windowMs),
      },
      durationSeconds: { gte: durationLower, lte: durationUpper },
    },
    select: { id: true },
  });
}

export async function findActivityByExternalId(
  athleteProfileId: string,
  sourceType: import('@prisma/client').DataSourceType,
  externalId: string,
): Promise<Pick<Activity, 'id'> | null> {
  return prisma.activity.findFirst({
    where: { athleteProfileId, sourceType, externalId },
    select: { id: true },
  });
}

export async function findActivityById(id: string): Promise<ActivityWithDetails | null> {
  return prisma.activity.findUnique({
    where: { id },
    include: {
      laps: { orderBy: { lapNumber: 'asc' } },
      swimLaps: { orderBy: { lapNumber: 'asc' } },
      metricSamples: { orderBy: { offsetSeconds: 'asc' } },
      timeInZones: { orderBy: { zoneNumber: 'asc' } },
      strengthSets: { orderBy: { setNumber: 'asc' } },
      strengthExercises: true,
    },
  });
}
