# Phase 3 Schema Deferred Models

These concepts were reviewed during P3-003 Step 1 and intentionally left out of
the first Prisma baseline schema.

The reason is not that they are unimportant. The reason is that each one needs
real behavior from a later phase before the database shape can be chosen well.

## Deferred Concepts

### `WeeklySummary`

Recommended timing: after initial read APIs or when analytics snapshots become
necessary.

For Phase 3, weekly summary data should be computed in service/API code from
activities and planned workouts. Persisting weekly snapshots too early risks
duplicating derived data before import volume and dashboard needs are clear.

### `ImportJob`

Recommended timing: Phase 4 import execution.

P3-003 should create `ImportedFile` and `RawActivityData`, but not a job model.
The job model should be shaped around the actual import pipeline once JSON/file
parsing, validation, deduplication and partial-import behavior are implemented.

### `CompletedWorkoutLink`

Recommended timing: Phase 5 Training Planning Core.

This link becomes important when planned workouts are compared against completed
activities. That requires plan-fulfillment behavior, matching rules and status
updates that are outside the Phase 3 database foundation.

Do not model this as a simple `completedActivityId` on `PlannedWorkout` unless
the product explicitly decides that one planned workout can only ever map to one
completed activity.

Questions to resolve first:

- Which completed activity matches a planned workout?
- How should moved/rescheduled workouts be handled?
- Can one planned workout be fulfilled by multiple activities?
- Can one activity fulfill multiple planned workouts?
- What counts as complete: date, sport, duration, distance, intensity, workout
  type or a weighted match?
- Which statuses are needed, e.g. `completed_as_planned`,
  `completed_modified`, `partial`, `missed`, `replaced`?
- Should the model store deltas such as duration difference, distance
  difference and intensity mismatch?
- Should AI Coach recommendations be allowed to override or annotate the match?

Likely future model shape:

- `plannedWorkoutId`
- `activityId`
- `matchStatus`
- `matchConfidence`
- `durationDeltaSeconds`
- `distanceDeltaMeters`
- `intensityMatch`
- `notes`

### `AiCoachRequest`

Recommended timing: Phase 6 AI Coach MVP.

Phase 3 prepares `AiCoachOutput` and `AthleteContextSnapshot`, but real request
lifecycle tracking should wait until prompts, provider calls, validation and
retry/error behavior are implemented.

### `AiCoachRecommendation`

Recommended timing: Phase 6+ after real AI output and analytics behavior exists.

Recommendations need status, priority, source output, related entities and
resolution behavior. The shape will be clearer once the AI Coach produces real
recommendations.

### `DailyHealthSummary`

Recommended timing: later health/recovery import work.

Health data is useful for recovery and AI context, but Phase 3 has no real
health source or import pipeline. Adding this table now would be speculative.

Deferred health/recovery metrics include:

- Body Battery
- Stress Level / Stress Score
- HRV Status
- HRV values
- Training Readiness
- Recovery Time
- Resting HR as daily history
- Steps
- Daily calories / active calories
- Acute Load / Training Load when it is not stored as an activity metric
- Garmin wellness summaries

### `SleepSummary`

Recommended timing: later health/recovery import work.

Sleep data should be modeled when the source coverage and recovery UX are clear.
It should not be part of the first activity/planning database baseline.

Deferred sleep metrics include:

- Sleep Score
- Sleep stages
- Sleep duration history
- Awake time
- REM / light / deep sleep distribution

## Safety Note

When these metrics are added later, the product must avoid medical-sounding
claims. They can inform training context and recovery hints, but should not be
presented as diagnosis, medical advice or a replacement for professional
guidance.

## Revisit Trigger

Revisit this file whenever a later issue needs one of these behaviors:

- import execution history
- plan fulfillment
- AI request lifecycle
- AI recommendations
- dashboard analytics snapshots
- health/recovery imports
