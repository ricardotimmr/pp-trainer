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
