import type { DailyHealthSummary, DataSourceType } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type UpsertDailyHealthData = {
  restingHeartRate?: number;
  steps?: number;
  floors?: number;
  activeCalories?: number;
  totalCalories?: number;
  avgStressLevel?: number;
  bodyBatteryLow?: number;
  bodyBatteryHigh?: number;
  avgRespiration?: number;
  avgSpo2?: number;
};

export async function upsertDailyHealth(
  athleteProfileId: string,
  date: Date,
  source: DataSourceType,
  data: UpsertDailyHealthData,
): Promise<DailyHealthSummary> {
  return prisma.dailyHealthSummary.upsert({
    where: { athleteProfileId_date_source: { athleteProfileId, date, source } },
    create: { athleteProfileId, date, source, ...data },
    update: data,
  });
}

export async function findDailyHealth(
  athleteProfileId: string,
  from: Date,
  to: Date,
): Promise<DailyHealthSummary[]> {
  return prisma.dailyHealthSummary.findMany({
    where: { athleteProfileId, date: { gte: from, lte: to } },
    orderBy: { date: 'asc' },
  });
}
