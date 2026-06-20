# P3-003 Prisma Schema Plan

Issue: [#36 P3-003 PostgreSQL and Prisma baseline schema](https://github.com/ricardotimmr/pp-trainer/issues/36)

Stand: 2026-06-20

## Goal

Build the first PostgreSQL/Prisma schema for the internal `pp-trainer` training
model.

This is the most important Batch A implementation step. The schema must support
Phase 2 prototype data, Phase 4 import/normalization work, later backend read
APIs and the future Athlete Context Builder without overfitting to Garmin or to
current frontend component shapes.

## Guardrails

- Model the internal app domain, not Garmin-specific source objects.
- Keep raw/import data separate from canonical app data.
- Keep Prisma models backend-internal; frontend contracts will be DTOs later.
- Prefer relational fields for core queryable app data.
- Use JSON only for source-shaped payloads, flexible snapshots or deliberately
  non-queryable details.
- Allow optional metrics where source coverage differs.
- Avoid premature multi-user/auth complexity, but keep `athleteProfileId`
  relations so single-user MVP can evolve later.
- Do not add seed data here. Seed data is P3-004.
- Do not build API routes here. Read APIs start after P3-006.

## Source Inventory

Primary sources:

- `docs/04-data-model.md`
- `docs/03-architecture.md`
- `docs/05-data-sources-and-import-strategy.md`
- `docs/local/phase-2-data-ownership.md`
- `apps/web/src/mock/prototypeData.types.ts`
- `docs/adr/ADR-003-database-and-orm.md`

Phase 2 additions that must be preserved:

- multiple goal priorities: `main_goal`, `secondary_goal`, `watchlist`
- swim pace and heart-rate time-series support
- swim laps with SWOLF, stroke count and stroke type
- strength sets/exercises with reps, load, duration, rest and notes
- sport-specific performance metrics and race predictors
- route-level missing/partial data behavior
- training-zone definitions separate from activity time-in-zone distributions

## Step Checklist

### Step 1 - Schema inventory and table decisions

Status: Done on 2026-06-20

Decide for every concept whether it becomes:

- a real Prisma model in P3-003
- an enum only
- a JSON field
- a later-phase concept

Expected output:

- a table-decision section added below
- explicit decisions for ambiguous concepts such as `WeeklySummary`,
  `ImportJob`, `CompletedWorkoutLink`, `AiCoachRequest`,
  `AiCoachRecommendation`, `DailyHealthSummary`, `SleepSummary`

### Step 2 - Prisma package setup

Status: Done on 2026-06-20

Do:

- install `prisma` and `@prisma/client`
- configure `prisma/schema.prisma`
- add useful root scripts:
  - `db:generate`
  - `db:validate`
  - `db:migrate`
  - `db:studio`
- ensure API build/typecheck still passes

Do not:

- add seeds yet
- add repositories yet

Result:

- `prisma` installed at the root for root-level database scripts.
- `@prisma/client` installed in `@pp-trainer/api`.
- `prisma/schema.prisma` configured with PostgreSQL datasource and Prisma
  Client generator.
- Root scripts added:
  - `db:format`
  - `db:generate`
  - `db:migrate`
  - `db:studio`
  - `db:validate`
- No domain models, seeds, repositories or migrations were added in this step.

### Step 3 - Enum baseline

Status: Done on 2026-06-20

Define stable internal enums before models:

- `SportType`
- `ActivityType`
- `DataSourceType`
- `Weekday`
- `TrainingGoalType`
- `GoalPriority`
- `TrainingZoneType`
- `TrainingZoneUnit`
- `TrainingPlanStatus`
- `TrainingPlanSource`
- `WorkoutType`
- `WorkoutIntensity`
- `WorkoutStatus`
- `PlannedWorkoutSource`
- `WorkoutStepType`
- `SwimStrokeType`
- `ImportedFileType`
- `ImportStatus`
- `RawDataFormat`
- `AiCoachOutputType`
- `AiCoachOutputStatus`
- `AiOutputValidationStatus`

Decision note:

- Use Prisma enum names in `PascalCase`.
- Use `@map` so database enum values preserve current snake_case app strings.
- DTO mapping can later translate Prisma enum members back to API strings.
- Deferred AI request/recommendation and health/recovery enums are intentionally
  not included.

### Step 4 - Athlete and zones models

Status: Done on 2026-06-20

Models:

- `AthleteProfile`
- `TrainingGoal`
- `TrainingAvailability`
- `TrainingAvailabilitySport` or JSON/list decision
- `TrainingZoneSet`
- `TrainingZone`

Key decisions:

- `primarySports` can be represented as enum list on `AthleteProfile`.
- `TrainingAvailability` should probably be relational because Settings and AI
  Coach query it structurally.
- `preferredSports` is an enum list on `TrainingAvailability`; no join model is
  needed for the MVP baseline.
- Zones are real relational models, not JSON.
- `bodyWeightKg` uses `Decimal(5,2)` because athlete body weight can be
  fractional.
- `TrainingGoal.targetDate` uses nullable `DateTime`; DTO formatting can expose
  date-only values later.
- Active zone-set uniqueness is not enforced with a DB constraint because Prisma
  does not model PostgreSQL partial unique indexes directly; enforce this in the
  service layer later if needed.

### Step 5 - Activities models

Status: Done on 2026-06-20

Models:

- `Activity`
- `ActivityLap`
- `ActivitySwimLap`
- `ActivityMetricSample`
- `ActivityTimeInZone`
- `ActivityStrengthSet`
- `ActivityStrengthExercise`

Key decisions:

- Store `ActivityMetricSample` relationally, indexed by
  `(activityId, offsetSeconds)`.
- Keep full GPS track features out of scope, but include optional
  `latitude`/`longitude` on `ActivityMetricSample` because it is low-cost and
  already appears in the broader data-model docs.
- Keep activity list fields on `Activity`, not only computed from samples.
- Swimming and strength details get dedicated models because Phase 2 already
  renders them.
- `ActivityTimeInZone` represents activity distribution and stays separate from
  training-zone definitions.
- `Activity.importedFileId` and `Activity.rawActivityDataId` are nullable string
  references for now; real Prisma relations should be added in Step 7 when
  `ImportedFile` and `RawActivityData` exist.
- Activity source deduplication uses indexes rather than a hard unique
  constraint because `externalId` can be missing and import matching needs
  service-layer fallback logic.

### Step 6 - Planning models

Status: Done on 2026-06-20

Models:

- `TrainingPlan`
- `PlannedWorkout`
- `WorkoutStep`

Key decisions:

- Planned workouts are distinct from completed activities.
- `CompletedWorkoutLink` is deferred because matching planned workouts to real
  activities needs dedicated plan-compliance logic.
- Workout steps should support bike/run/swim/strength target fields without
  sport-specific child tables for now.
- `TrainingPlan.goalId` is a real optional relation to `TrainingGoal`.
- `TrainingPlan.aiCoachOutputId` and `PlannedWorkout.aiCoachOutputId` remain
  nullable strings until `AiCoachOutput` exists in Step 7.
- `TrainingPlan.startDate`, `TrainingPlan.endDate` and
  `PlannedWorkout.scheduledDate` use `DateTime`; API DTOs can expose date-only
  strings later.

### Step 7 - Performance, import and AI foundation models

Status: Done on 2026-06-20

Models:

- `PerformanceSportMetric`
- `RacePrediction`
- `ImportedFile`
- `RawActivityData`
- `AiCoachOutput`
- `AthleteContextSnapshot`

Potentially deferred:

- `ImportJob`
- `AiCoachRequest`
- `AiCoachRecommendation`

Key decisions:

- Sport-specific performance metrics are not collapsed into one generic athlete
  value.
- Raw payloads/snapshots can use JSON.
- Import metadata must support deduplication and history.
- AI snapshot/output models are foundations only; no real AI calls in Phase 3.
- `PerformanceSportMetric` is unique per athlete and sport.
- `RacePrediction` is unique per athlete, sport and distance in meters; the
  display label can change without affecting identity.
- `ImportedFile.fileHash` is nullable but unique per athlete so real hashes can
  support deduplication while missing hashes stay allowed.
- `RawActivityData` keeps source-shaped payloads in `Json?` and can also point
  to a future raw file path/storage key.
- `Activity.importedFileId` and `Activity.rawActivityDataId` are now real
  optional relations.
- `TrainingPlan.aiCoachOutputId`, `PlannedWorkout.aiCoachOutputId`,
  `AiCoachOutput.createdTrainingPlanId` and
  `AiCoachOutput.createdPlannedWorkoutId` are real optional relations.
- `AiCoachRequest`, `ImportJob` and `AiCoachRecommendation` remain deferred.

### Step 8 - Relations, indexes and constraints

Status: Done on 2026-06-20

Add deliberately after models exist:

- activity timeline indexes by athlete and `startTime`
- workout schedule indexes by athlete/date/status
- unique or indexed dedup fields:
  - `sourceType + externalId`
  - `fileHash`
  - activity similarity fields: sport/start/duration/distance
- zone ordering by `trainingZoneSetId + zoneNumber`
- workout step ordering by `plannedWorkoutId + stepIndex`
- time-series ordering by `activityId + offsetSeconds`

Cascade/delete rules:

- Be conservative.
- Deleting the single athlete should delete owned data in local MVP.
- Deleting activity children with activity is acceptable.
- Avoid cascade behavior that could accidentally delete raw import history
  unless explicitly intended.

Implemented additions:

- added athlete-scoped activity source index:
  `(athleteProfileId, sourceType, externalId)`
- added activity similarity fallback index:
  `(athleteProfileId, sport, startTime, durationSeconds, distanceMeters)`
- added athlete/status workout schedule index:
  `(athleteProfileId, status, scheduledDate)`
- added athlete-scoped raw-data source index:
  `(athleteProfileId, sourceType, externalId)`
- added `ImportedFile.createdActivityId` index for import-history navigation

Explicit non-goals:

- no hard unique constraint on `sourceType + externalId` because `externalId`
  can be missing and fallback deduplication belongs in the import service
- no partial unique constraint for active zone sets because Prisma does not
  model PostgreSQL partial unique indexes directly
- no `CompletedWorkoutLink` relation in this baseline

### Step 9 - Validate, generate and migrate

Status: Done on 2026-06-20

Run:

- `npm run db:validate`
- `npm run db:generate`
- `npm run typecheck:api`
- `npm run build:api`

If local PostgreSQL is available:

- run a first migration

If local PostgreSQL is not available:

- do not fake success
- document that validation/generation passed and migration is pending local DB
  setup

Result:

- `docker-compose.yml` now provides local PostgreSQL via Docker Compose.
- `.env.example` and local `.env` use the Docker PostgreSQL credentials.
- root scripts were added for local DB lifecycle:
  - `db:up`
  - `db:down`
  - `db:reset`
- `npm run db:validate` passed.
- `npm run db:generate` passed.
- `npm run typecheck:api` passed.
- `npm run build:api` passed.
- `npm run lint:api` passed.
- `npm run db:migrate -- --name init` created and applied the initial
  migration:
  `prisma/migrations/20260620110506_init/migration.sql`
- `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma
  --script` successfully generated SQL.

## Table Decisions

| Concept                                    | Decision                                                  | Reason                                                                                                                                                   | Phase    |
| ------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `AthleteProfile`                           | Prisma model                                              | Central single-user profile and AI context base.                                                                                                         | P3-003   |
| `TrainingGoal`                             | Prisma model                                              | Goals are persisted settings and influence AI context.                                                                                                   | P3-003   |
| `TrainingAvailability`                     | Prisma model                                              | Settings and AI Coach need structured weekday availability.                                                                                              | P3-003   |
| `TrainingAvailability.preferredSports`     | Scalar enum list if Prisma/PostgreSQL supports it cleanly | Queryable enough for MVP without a join table. Revisit only if constraints require a join model.                                                         | P3-003   |
| `TrainingZoneSet`                          | Prisma model                                              | Zones are editable/queryable app data, not display-only JSON.                                                                                            | P3-003   |
| `TrainingZone`                             | Prisma model                                              | Zone ranges need stable ordering and clear units for UI and AI.                                                                                          | P3-003   |
| `Activity`                                 | Prisma model                                              | Core completed workout entity used by dashboard, activity list, detail and AI context.                                                                   | P3-003   |
| `ActivityLap`                              | Prisma model                                              | Running/cycling splits and laps are visible in Activity Detail and importable.                                                                           | P3-003   |
| `ActivitySwimLap`                          | Prisma model                                              | Swimming uses different fields: SWOLF, stroke count, stroke type and pace per 100m.                                                                      | P3-003   |
| `ActivityMetricSample`                     | Prisma model                                              | Time-series charts are a validated product surface and need ordered queryable data.                                                                      | P3-003   |
| `ActivityTimeInZone`                       | Prisma model                                              | Activity zone distribution is separate from training-zone definitions.                                                                                   | P3-003   |
| `ActivityStrengthSet`                      | Prisma model                                              | Strength activities need structured sets/reps/load instead of chart whitespace.                                                                          | P3-003   |
| `ActivityStrengthExercise`                 | Prisma model                                              | Exercise summaries are rendered and useful for strength-specific detail views.                                                                           | P3-003   |
| `TrainingPlan`                             | Prisma model                                              | Planned training week is a core MVP object.                                                                                                              | P3-003   |
| `PlannedWorkout`                           | Prisma model                                              | Planned sessions are distinct from completed activities.                                                                                                 | P3-003   |
| `WorkoutStep`                              | Prisma model                                              | Structured steps are required for workout detail and future AI outputs.                                                                                  | P3-003   |
| `PerformanceSportMetric`                   | Prisma model                                              | Performance values must remain sport-specific for UI and AI context.                                                                                     | P3-003   |
| `RacePrediction`                           | Prisma model                                              | Race predictors are sport-specific, displayed and source-derived.                                                                                        | P3-003   |
| `ImportedFile`                             | Prisma model                                              | Import history and athlete-scoped file deduplication need persistence before Phase 4 parsing.                                                            | P3-003   |
| `RawActivityData`                          | Prisma model                                              | Raw/source payloads must be separate from canonical activity data.                                                                                       | P3-003   |
| `AiCoachOutput`                            | Prisma model                                              | AI preview/output needs a persistence target before real AI generation.                                                                                  | P3-003   |
| `AthleteContextSnapshot`                   | Prisma model                                              | Context snapshots support future reproducibility and AI debugging.                                                                                       | P3-003   |
| Stable categories                          | Prisma enums                                              | Internal categories should be constrained and source-agnostic.                                                                                           | P3-003   |
| `RawActivityData.rawPayload`               | JSON field                                                | Raw source payload is source-shaped and not the UI contract.                                                                                             | P3-003   |
| `AthleteContextSnapshot.structuredContext` | JSON field                                                | Context is a versioned snapshot, not normalized app state.                                                                                               | P3-003   |
| `AiCoachOutput.structuredOutput`           | JSON field                                                | AI output schemas will evolve; raw structured output can be stored flexibly.                                                                             | P3-003   |
| `AiCoachOutput.validationErrors`           | JSON field or string list depending on Prisma support     | Validation errors are flexible diagnostics.                                                                                                              | P3-003   |
| `WeeklySummary`                            | Deferred                                                  | Prefer computed DTO/service result until real data volume shows snapshot needs.                                                                          | Later    |
| `ImportJob`                                | Deferred                                                  | `ImportedFile` and `RawActivityData` are enough before Phase 4 import execution.                                                                         | Phase 4  |
| `CompletedWorkoutLink`                     | Deferred                                                  | Plan fulfillment belongs with Training Planning Core and completed-vs-planned logic.                                                                     | Phase 5  |
| `AiCoachRequest`                           | Deferred                                                  | Real AI request lifecycle starts with AI Coach MVP work.                                                                                                 | Phase 6  |
| `AiCoachRecommendation`                    | Deferred                                                  | Recommendations need real AI/analytics behavior first.                                                                                                   | Phase 6+ |
| `DailyHealthSummary`                       | Deferred                                                  | No health/recovery import in Phase 3. This also defers Body Battery, stress, HRV, Training Readiness, recovery time, steps and daily wellness summaries. | Later    |
| `SleepSummary`                             | Deferred                                                  | No sleep import or recovery analysis in Phase 3. This also defers sleep score and sleep stages.                                                          | Later    |

## Resolved Questions

- `TrainingAvailability.preferredSports` uses a scalar enum list for the MVP
  baseline. Revisit only if query or constraint needs require a join model.
- `WeeklySummary` is deferred and should be computed in API/service code until
  analytics snapshot needs are clearer.
- `ActivityMetricSample` includes optional `latitude`/`longitude`, but full GPS
  track features remain out of scope.
- `ImportJob` is deferred to Phase 4 import execution.
- `AiCoachRequest` is deferred to Phase 6 AI Coach MVP work.
- Garmin health/recovery metrics such as Body Battery, Stress, Sleep Score, HRV
  Status and Training Readiness are deferred under later `DailyHealthSummary` /
  `SleepSummary` work.
- Prisma enum members use `PascalCase` and preserve database snake_case values
  via `@map`.

## Completion Criteria

P3-003 is complete when:

- Prisma and Prisma Client are installed.
- `prisma/schema.prisma` contains the Phase 3 baseline schema.
- The schema covers the internal model needed by Phase 2 data and Phase 4 import.
- Raw/import data and canonical app data are separate.
- Optional/sport-specific metrics are supported without fake required fields.
- Key relations, indexes and deduplication fields exist.
- Prisma validate/generate pass.
- Migration is either executed locally or explicitly documented as pending DB
  setup.
