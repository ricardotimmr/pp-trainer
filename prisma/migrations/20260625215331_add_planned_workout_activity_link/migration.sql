-- Add a nullable link from planned workouts to completed activities.
-- PostgreSQL unique indexes allow multiple NULL values, so this enforces
-- one linked workout per activity without blocking unlinked planned workouts.
ALTER TABLE "PlannedWorkout" ADD COLUMN "activityId" TEXT;

CREATE UNIQUE INDEX "PlannedWorkout_activityId_key" ON "PlannedWorkout"("activityId");

ALTER TABLE "PlannedWorkout"
ADD CONSTRAINT "PlannedWorkout_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "Activity"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
