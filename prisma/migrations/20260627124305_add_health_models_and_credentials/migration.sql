-- AlterTable
ALTER TABLE "DataSourceConnection" ADD COLUMN     "password" TEXT,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "SyncJob" ADD COLUMN     "healthDaysFound" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "healthDaysImported" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DailyHealthSummary" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "source" "DataSourceType" NOT NULL,
    "restingHeartRate" INTEGER,
    "steps" INTEGER,
    "floors" INTEGER,
    "activeCalories" INTEGER,
    "totalCalories" INTEGER,
    "avgStressLevel" INTEGER,
    "bodyBatteryLow" INTEGER,
    "bodyBatteryHigh" INTEGER,
    "avgRespiration" DOUBLE PRECISION,
    "avgSpo2" DOUBLE PRECISION,

    CONSTRAINT "DailyHealthSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleepSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "source" "DataSourceType" NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "totalSleepSeconds" INTEGER,
    "deepSleepSeconds" INTEGER,
    "lightSleepSeconds" INTEGER,
    "remSleepSeconds" INTEGER,
    "awakeSeconds" INTEGER,
    "sleepScore" INTEGER,
    "avgStress" DOUBLE PRECISION,
    "avgSpo2" DOUBLE PRECISION,

    CONSTRAINT "SleepSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrvStatus" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "source" "DataSourceType" NOT NULL,
    "weeklyAvgHrv" DOUBLE PRECISION,
    "lastNightAvgHrv" DOUBLE PRECISION,
    "lastNightFiveMinHigh" DOUBLE PRECISION,
    "status" TEXT,

    CONSTRAINT "HrvStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyHealthSummary_athleteProfileId_date_idx" ON "DailyHealthSummary"("athleteProfileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyHealthSummary_athleteProfileId_date_source_key" ON "DailyHealthSummary"("athleteProfileId", "date", "source");

-- CreateIndex
CREATE INDEX "SleepSession_athleteProfileId_date_idx" ON "SleepSession"("athleteProfileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SleepSession_athleteProfileId_date_source_key" ON "SleepSession"("athleteProfileId", "date", "source");

-- CreateIndex
CREATE INDEX "HrvStatus_athleteProfileId_date_idx" ON "HrvStatus"("athleteProfileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HrvStatus_athleteProfileId_date_source_key" ON "HrvStatus"("athleteProfileId", "date", "source");

-- AddForeignKey
ALTER TABLE "DailyHealthSummary" ADD CONSTRAINT "DailyHealthSummary_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepSession" ADD CONSTRAINT "SleepSession_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrvStatus" ADD CONSTRAINT "HrvStatus_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
