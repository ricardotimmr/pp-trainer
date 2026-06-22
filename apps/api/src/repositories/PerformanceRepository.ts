import type { PerformanceSportMetric, RacePrediction } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export async function findPerformanceMetrics(
  athleteProfileId: string,
): Promise<PerformanceSportMetric[]> {
  return prisma.performanceSportMetric.findMany({
    where: { athleteProfileId },
    orderBy: { sport: 'asc' },
  });
}

export async function findRacePredictions(
  athleteProfileId: string,
): Promise<RacePrediction[]> {
  return prisma.racePrediction.findMany({
    where: { athleteProfileId },
    orderBy: [{ sport: 'asc' }, { distanceMeters: 'asc' }],
  });
}
