-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "importedFileId" TEXT,
    "status" "ImportStatus" NOT NULL,
    "sourceType" "DataSourceType" NOT NULL,
    "rawPayloadHash" TEXT,
    "activityId" TEXT,
    "errorMessage" TEXT,
    "warningMessages" TEXT[],

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportJob_athleteProfileId_createdAt_idx" ON "ImportJob"("athleteProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_rawPayloadHash_idx" ON "ImportJob"("rawPayloadHash");

-- CreateIndex
CREATE INDEX "ImportJob_activityId_idx" ON "ImportJob"("activityId");

-- CreateIndex
CREATE INDEX "ImportJob_importedFileId_idx" ON "ImportJob"("importedFileId");

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_importedFileId_fkey" FOREIGN KEY ("importedFileId") REFERENCES "ImportedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
