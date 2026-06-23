# Phase 5 Planning Followups

These decisions were deferred during Phase 5 implementation. They should be revisited before or during the phases listed.

## Workout status transitions are permissive

Phase 5 allows any `PUT /api/workouts/:id` to set any valid status value with no state-machine enforcement. A `cancelled` workout can be set back to `completed` directly.

Phase 6 may need to harden this for AI-generated workouts. Consider a service-layer guard that validates the transition is legal before writing: `planned → completed | missed | cancelled`, `cancelled → planned`, `completed | missed → planned`.

## Workout deletion has no cascade UI warning

`DELETE /api/workouts/:id` is implemented but there is no confirmation step that warns the user if the workout has already been logged or has an activity linked to it. Phase 6 or later should check for linked `activityId` before deleting and surface a warning in the UI.

## Zone references in WorkoutStep are accepted but unused

`targetHeartRateZoneId`, `targetPowerZoneId` and `targetPaceZoneId` fields on `WorkoutStep` are accepted by the schema and persisted, but there is no UI to browse or pick zones when creating a workout, and no validation that the referenced zone IDs exist. The AI Coach in Phase 6 will populate these when generating structured workouts — a zone picker UI can follow in Phase 7 or 8.

## Plan editing is limited to status and metadata

The `PUT /api/training-plans/:id` endpoint accepts full field updates (title, dates, description, status), but there is no form in the UI to edit these fields once a plan is created beyond using the inline edit modal (title, dates, status, description). Reordering workouts within a plan and drag-and-drop scheduling are deferred to Phase 8.

## No plan-level workout assignment validation

A workout can be assigned to any plan regardless of whether its `scheduledDate` falls within the plan's `startDate`–`endDate` range. The API does not validate this. Phase 6 or later could add a service-layer check for AI-generated schedules where date alignment is important for plan coherence.

## Only one active plan is a convention, not a database constraint

There is no database unique index or trigger enforcing that only one `TrainingPlan` per athlete can have `status = 'Active'`. The convention is upheld in the UI by the "Activate" button deactivating implicitly — but no backend guard exists. If the AI Coach creates a plan and sets it active, a second active plan could exist. Add a service-layer check in `createTrainingPlan` and `updateTrainingPlan` if this becomes a problem in Phase 6.
