-- Partial unique index: enforce at most one active plan per athlete at DB level.
-- The service-layer guard (deactivateOtherActivePlans) already prevents duplicates,
-- but this index makes it a hard constraint that survives direct DB writes and future migrations.
CREATE UNIQUE INDEX "TrainingPlan_athleteProfileId_active_unique"
    ON "TrainingPlan" ("athleteProfileId")
    WHERE "status" = 'active';
