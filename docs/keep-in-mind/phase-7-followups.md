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
