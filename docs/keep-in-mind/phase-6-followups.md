# Phase 6 Followups

These items were deferred during Phase 6 implementation. They should be revisited in Phase 7 or later as noted.

## Zone picker UI for WorkoutStep targets

The AI Coach populates `targetHeartRateZoneName`, `targetPowerZoneName` and `targetPaceZoneName` as human-readable strings (e.g. `"Zone 2"`). These are stored in the `notes` field of `WorkoutStep` — not as FK references to `TrainingZone` records.

The DB fields `targetHeartRateZoneId`, `targetPowerZoneId` and `targetPaceZoneId` remain unset for AI-generated steps. There is no UI to browse or pick zones when creating or editing a workout step manually, and no validation that zone names correspond to configured zones.

Phase 7 or 8 should: build a zone picker UI, resolve the FK mapping from name to ID, and update `AiAcceptService` to populate the FK when a matching zone exists.

## Workout status transition hardening for AI-generated content

The current `PUT /api/workouts/:id` endpoint allows any status value to be set without state-machine validation. A `cancelled` workout can be set back to `completed` directly.

AI-generated workouts do not have stricter transition guards than manually created ones. Phase 7 could introduce a service-layer guard: `planned → completed | missed | cancelled`, `cancelled → planned`, `completed | missed → planned`.

## Cascade warning on workout deletion when activityId is linked

`DELETE /api/workouts/:id` works without a warning when the workout has an `activityId` linked to it. The UI shows no confirmation step.

Phase 7 should check for a linked `activityId` before deletion and surface a warning: "This workout is linked to an activity. Deleting it will not delete the activity."

## Plan-level workout date alignment validation

A workout can be assigned to any training plan regardless of whether its `scheduledDate` falls within the plan's `startDate`–`endDate` range. The API does not validate this.

AI Coach-generated week plans always schedule workouts within the generated week range, so this is harmless in practice today. Phase 7 could add a service-layer check in `assignWorkoutToPlan` and during `POST /api/workouts` when a `trainingPlanId` is provided.

## Only one active plan is a convention, not a DB constraint

`deactivateOtherActivePlans` in the repository service enforces single-active-plan via application logic. There is no database unique index or trigger. If a future migration or admin tool writes directly to the DB, a second active plan could exist.

Phase 7 or later could add a partial unique index: `CREATE UNIQUE INDEX one_active_plan ON "TrainingPlan" ("athleteProfileId") WHERE status = 'Active'`.

## AI request history endpoint

`GET /api/ai/history` was declared as a post-MVP endpoint in the concept doc and was not implemented in Phase 6. The `AiCoachOutput` records exist in the DB — building a history view in Phase 7 only requires a repository query + route.

## Prompt versioning

Prompt templates live directly in `PromptBuilder.ts`. If the prompt structure changes significantly, there is no version tag on the prompt itself — only the `AthleteContext` has `contextVersion: 'v1'`. Phase 7 could add a `promptVersion` field to `AiCoachOutput` if prompt reproducibility becomes important for debugging or evaluation.

## Recent proposals panel on AI Coach page

The AI Coach page currently has no history of past AI-generated proposals. The `AiCoachOutput` records already exist in the DB with status (`Draft`, `Accepted`, `Rejected`). A "Recent proposals" block below the generate form would let the user re-open, compare, or accept a previous output without triggering a new generation.

This needs more design thinking: how many proposals to show, which statuses to surface, whether to link directly to the preview page, and how to handle expired/invalid outputs. Pairs well with the "AI request history endpoint" item above — the backend query is the same.
