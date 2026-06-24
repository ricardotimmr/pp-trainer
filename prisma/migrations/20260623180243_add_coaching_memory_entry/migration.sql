-- CreateTable
CREATE TABLE "CoachingMemoryEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "athleteProfileId" TEXT NOT NULL,
    "aiCoachOutputId" TEXT,
    "outputType" "AiCoachOutputType" NOT NULL,
    "entryText" TEXT NOT NULL,
    "weekStartDate" TEXT,

    CONSTRAINT "CoachingMemoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachingMemoryEntry_athleteProfileId_createdAt_idx" ON "CoachingMemoryEntry"("athleteProfileId", "createdAt");

-- AddForeignKey
ALTER TABLE "CoachingMemoryEntry" ADD CONSTRAINT "CoachingMemoryEntry_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
