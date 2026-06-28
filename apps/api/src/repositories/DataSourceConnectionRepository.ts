import type { DataSourceConnection, DataSourceType, Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type ConnectionData = {
  isActive?: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  lastSyncedAt?: Date | null;
  lastSyncedItemAt?: Date | null;
  externalUserId?: string | null;
  username?: string | null;
  password?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function findConnection(
  athleteProfileId: string,
  source: DataSourceType,
): Promise<DataSourceConnection | null> {
  return prisma.dataSourceConnection.findUnique({
    where: { athleteProfileId_source: { athleteProfileId, source } },
  });
}

export async function upsertConnection(
  athleteProfileId: string,
  source: DataSourceType,
  data: ConnectionData,
): Promise<DataSourceConnection> {
  return prisma.dataSourceConnection.upsert({
    where: { athleteProfileId_source: { athleteProfileId, source } },
    create: { athleteProfileId, source, ...data },
    update: data,
  });
}

export async function deleteConnection(
  athleteProfileId: string,
  source: DataSourceType,
): Promise<void> {
  await prisma.dataSourceConnection.deleteMany({ where: { athleteProfileId, source } });
}
