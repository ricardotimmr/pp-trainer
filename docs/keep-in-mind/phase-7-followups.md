# Phase 7 Followups

These items were deferred during Phase 7 implementation. They should be revisited in Phase 8 or later as noted.

## Cascade warning on workout deletion (P7-003, Part 1)

`DELETE /api/workouts/:id` has no guard for linked activities because `PlannedWorkout` has no `activityId` field — there is no FK relationship between a planned workout and a completed activity in the current schema.

The cascade warning from P7-003 was explicitly skipped. Implementing it requires:

1. Add `activityId String?` to `PlannedWorkout` in the Prisma schema (FK → `Activity.id`, nullable, `onDelete: SetNull`)
2. A migration (non-destructive — nullable field, no backfill needed)
3. A workflow that sets `activityId` when a user links an activity to a planned workout (the plan fulfillment UI)
4. The 409-guard in `deleteWorkout`: if `activityId != null`, return `409 Conflict { linkedActivityId, message }` and require `?force=true` to proceed
5. Frontend confirmation dialog when delete returns 409

This is blocked on the `CompletedWorkoutLink` / plan fulfillment feature — see `phase-3-schema-deferred-models.md`. The questions raised there (one-to-one vs. one-to-many, match criteria, confidence scoring) should be resolved before the schema is extended.

**Phase 8** is the right time for this alongside the plan fulfillment feature.

## CompletedWorkoutLink / Plan Fulfillment

Auto-matching imported activities against planned workouts (date, sport, duration heuristic) so planned workouts are automatically marked completed when a matching activity is uploaded.

Schema shape described in `phase-3-schema-deferred-models.md`. Requires resolving:
- Match criteria (date, sport, duration tolerance)
- One-to-one vs. one-to-many cardinality
- Whether auto-match should be confirmed by the user or applied silently
- What `matchStatus` values are needed (`completed_as_planned`, `completed_modified`, `partial`, etc.)

**Phase 8.**

## Zone picker UI for WorkoutStep targets

Carried over from `phase-6-followups.md`. Phase 7 added best-effort zone name → FK resolution in `AiAcceptService` (P7-007), but there is still no UI for manually picking zones when creating or editing a workout step. The `targetHeartRateZoneId`, `targetPowerZoneId`, `targetPaceZoneId` fields remain unset for manually created steps.

**Phase 8.**

## Dashboard charts

Weekly volume over time, sport distribution chart. Enough activity data will exist by Phase 8 to make these meaningful.

**Phase 8.**

## Import history UI

Show past import attempts (success, duplicate, failed) with file names and timestamps. The `ImportJob` records and `ImportedFile` records already exist — only the UI is missing.

**Phase 8.**

## Drag-and-drop workout scheduling

Rescheduling workouts by dragging them across days in the Training Plan week view.

**Phase 8+.**

## AI workout editing before accepting

Currently the flow is: generate → preview → accept (then edit in Workout Detail). Phase 8 could allow editing steps inline on the AI preview page before accepting.

**Phase 8.**

## SettingsPage API migration

`SettingsPage` is the last page still using `usePrototypeAthleteContext` (prototype mock data). Migrating it requires write-capable API endpoints for:
- Athlete profile (weight, height, thresholds)
- Training zones (CRUD per zone set)
- Goals (create, update, delete, priority)
- Availability / active days

These are read-only in the current API. Until this migration is done, SettingsPage shows prototype data, not live DB data.

**Phase 8.**

## DATA_MODE dead code cleanup

5 pages still contain `DATA_MODE` branches (`if (DATA_MODE === 'mock') ...`) that are never executed because `VITE_DATA_MODE=api` is set in `.env`. These paths exist as a safety net from the Phase 2 → API migration. Once SettingsPage is migrated and mock mode is fully retired, remove all `DATA_MODE` checks and the mock data imports.

**Phase 8 — after SettingsPage migration.**

## Delete outdated Phase 2 e2e tests

3 Playwright spec files reference prototype mock data and no longer apply to the real API:
- `apps/web/e2e/phase-2-routes.spec.ts`
- `apps/web/e2e/phase-2-empty-states.spec.ts`
- `apps/web/e2e/activity-detail.spec.ts`

Currently excluded from Vitest via root `vitest.config.ts`. Should be deleted or rewritten for Phase 7+ API flows.

**Phase 8.**

## Toast / success notification after AI accept

After accepting an AI plan or workout, the user is silently navigated to `/training-plan` or `/workouts/:id` with no visual confirmation. A brief success toast ("Plan activated" / "Workout added") would improve the UX.

**Phase 8.**

## FIT cadence for running — device verification needed

`PlannedWorkout` steps pass `rec.cadence` as-is from `fit-file-parser`. Whether the library returns strides/min (raw FIT) or steps/min (device-normalized) depends on the library version and device firmware. The chart renders correctly if the value is present, but the unit may be off by 2× on some devices.

Monitor once real running FIT files are imported. If users report wrong cadence values, check whether the value needs to be doubled.

**Monitor in Phase 8.**
