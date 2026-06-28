-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('running', 'completed', 'failed');

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "source" "DataSourceType" NOT NULL,
    "status" "SyncJobStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "activitiesFound" INTEGER NOT NULL DEFAULT 0,
    "activitiesImported" INTEGER NOT NULL DEFAULT 0,
    "activitiesSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSourceConnection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "source" "DataSourceType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncedItemAt" TIMESTAMP(3),
    "externalUserId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "DataSourceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncJob_athleteProfileId_createdAt_idx" ON "SyncJob"("athleteProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "SyncJob_athleteProfileId_source_idx" ON "SyncJob"("athleteProfileId", "source");

-- CreateIndex
CREATE INDEX "DataSourceConnection_athleteProfileId_idx" ON "DataSourceConnection"("athleteProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "DataSourceConnection_athleteProfileId_source_key" ON "DataSourceConnection"("athleteProfileId", "source");

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSourceConnection" ADD CONSTRAINT "DataSourceConnection_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
