import type { DataSourceType, HrvStatus } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type UpsertHrvData = {
  weeklyAvgHrv?: number;
  lastNightAvgHrv?: number;
  lastNightFiveMinHigh?: number;
  status?: string;
};

export async function upsertHrvStatus(
  athleteProfileId: string,
  date: Date,
  source: DataSourceType,
  data: UpsertHrvData,
): Promise<HrvStatus> {
  return prisma.hrvStatus.upsert({
    where: { athleteProfileId_date_source: { athleteProfileId, date, source } },
    create: { athleteProfileId, date, source, ...data },
    update: data,
  });
}

export async function findHrvStatuses(
  athleteProfileId: string,
  from: Date,
  to: Date,
): Promise<HrvStatus[]> {
  return prisma.hrvStatus.findMany({
    where: { athleteProfileId, date: { gte: from, lte: to } },
    orderBy: { date: 'asc' },
  });
}
