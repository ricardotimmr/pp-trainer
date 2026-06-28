-- Link imported activity jobs to the sync run that created them.
-- Manual uploads/imports keep this field null and continue to render as
-- individual history entries.
ALTER TABLE "ImportJob" ADD COLUMN "syncJobId" TEXT;

CREATE INDEX "ImportJob_syncJobId_idx" ON "ImportJob"("syncJobId");

ALTER TABLE "ImportJob"
ADD CONSTRAINT "ImportJob_syncJobId_fkey"
FOREIGN KEY ("syncJobId") REFERENCES "SyncJob"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
