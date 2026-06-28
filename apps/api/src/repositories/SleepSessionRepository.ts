import type { DataSourceType, SleepSession } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type UpsertSleepData = {
  startTime?: Date;
  endTime?: Date;
  totalSleepSeconds?: number;
  deepSleepSeconds?: number;
  lightSleepSeconds?: number;
  remSleepSeconds?: number;
  awakeSeconds?: number;
  sleepScore?: number;
  avgStress?: number;
  avgSpo2?: number;
};

export async function upsertSleepSession(
  athleteProfileId: string,
  date: Date,
  source: DataSourceType,
  data: UpsertSleepData,
): Promise<SleepSession> {
  return prisma.sleepSession.upsert({
    where: { athleteProfileId_date_source: { athleteProfileId, date, source } },
    create: { athleteProfileId, date, source, ...data },
    update: data,
  });
}

export async function findSleepSessions(
  athleteProfileId: string,
  from: Date,
  to: Date,
): Promise<SleepSession[]> {
  return prisma.sleepSession.findMany({
    where: { athleteProfileId, date: { gte: from, lte: to } },
    orderBy: { date: 'asc' },
  });
}
