-- Replace the nullable activityId column on PlannedWorkout with a dedicated
-- CompletedWorkoutLink junction table. This allows link metadata
-- (linkedAt, matchConfidence) to be stored for future auto-matching without
-- requiring another schema migration.

-- Drop the column-based approach from the previous migration
ALTER TABLE "PlannedWorkout" DROP CONSTRAINT "PlannedWorkout_activityId_fkey";
DROP INDEX "PlannedWorkout_activityId_key";
ALTER TABLE "PlannedWorkout" DROP COLUMN "activityId";

-- Create junction table
CREATE TABLE "CompletedWorkoutLink" (
    "id" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchConfidence" DECIMAL(4,3),
    "plannedWorkoutId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    CONSTRAINT "CompletedWorkoutLink_pkey" PRIMARY KEY ("id")
);

-- Each planned workout links to at most one activity, and vice versa
CREATE UNIQUE INDEX "CompletedWorkoutLink_plannedWorkoutId_key" ON "CompletedWorkoutLink"("plannedWorkoutId");
CREATE UNIQUE INDEX "CompletedWorkoutLink_activityId_key" ON "CompletedWorkoutLink"("activityId");

-- Cascade both ways: deleting either side removes the link
ALTER TABLE "CompletedWorkoutLink"
ADD CONSTRAINT "CompletedWorkoutLink_plannedWorkoutId_fkey"
FOREIGN KEY ("plannedWorkoutId") REFERENCES "PlannedWorkout"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompletedWorkoutLink"
ADD CONSTRAINT "CompletedWorkoutLink_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "Activity"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
