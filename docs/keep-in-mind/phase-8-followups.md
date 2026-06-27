# Phase 8 Followups

These items were intentionally deferred during Phase 8 implementation.

## Dashboard quick tiles after richer imports

P8-006 originally proposed additional Dashboard quick tiles for next workout,
last activity and week balance.

During implementation review, those tiles were intentionally not kept:

- next workout is already represented by the existing Upcoming Workouts section
- last activity is already represented by the existing Recent Activities section
- week balance is already represented by the Dashboard hero weekly volume block

Adding another quick tile strip duplicated visible information and made the
Dashboard feel busier without giving the user a new decision point.

Revisit Dashboard quick tiles after richer imported data exists, especially
from Garmin or other external sources. More useful future tiles could include:

- training consistency over the last 7 days
- load trend compared with the previous week
- recovery/readiness signals such as HRV, sleep score, Body Battery or Training
  Readiness
- open actions such as missing imports, missing zones or goals without target
  dates
- plan adherence after completed activities are linked to planned workouts

Until those data sources exist, keep the Dashboard focused on the hero weekly
volume, existing workout/activity sections and the analytics charts.

## Real AI provider hardening after API key setup

Phase 8 wires the AI Coach flows end to end, but the local prototype still uses
the mock provider unless a real provider API key is configured.

Once an API key is available, revisit all AI flows as a dedicated hardening
pass:

- week plan generation
- single workout generation
- week analysis generation
- accept/reject lifecycle behavior
- structured output validation errors
- prompt quality and required context
- provider-specific timeout, retry and error handling
- real-output UX copy for invalid or partial AI responses

The current mock provider should stay useful for local development and tests,
but real provider output must be reviewed before treating the AI features as
production-quality coaching behavior.

## Week plan inline editing

P8-012 intentionally adds inline step editing only to the AI single-workout
preview. Week-plan editing is deferred because week plans contain nested
workouts and steps, which needs a dedicated interaction model.

When revisiting this:

- reuse the single-workout step editor behavior where possible
- keep only one nested step editable at a time
- pass a validated week-plan override during accept
- preserve the original AI structured output for audit/debugging
- decide how edited nested workouts should be visually marked in collapsed
  week-plan workout cards

## Swimming zone distance sync bug (P8-014)

When a swimming pace zone is selected in `AiWorkoutPreviewPage`'s step
editor, the zone bounds (sec/100m) are stored in fields named
`paceLowerSecPerKm`/`paceUpperSecPerKm`. The sync function treats them as
sec/km, so selecting a 1:40/100m zone and typing 30 min gives ~18 km
instead of 1.8 km.

Fix:
- Add `paceUnit: 'sec_per_km' | 'sec_per_100m'` to `StepEditDraft`
- Set it to `'sec_per_100m'` when a swimming zone is selected
- Multiply by 10 inside `getEffectivePaceSecPerKm` when unit is `sec_per_100m`
- Also fix the inline distance patch in the `onSelect` callback for the
  swimming `AiZonePicker`

Low priority: swimming workouts are uncommon and users can correct the
distance manually.

## External data source integration (Phase 9)

Garmin, Strava, and other external data sources are the primary Phase 9 goal.
Key decisions when building:

- Implement as adapters that map external formats to internal `Activity` model
- Do not change the internal data model for any specific external source
- Official Garmin API first; python-garminconnect as private fallback
- Strava API after Garmin
- Authentication layer must exist before any OAuth-based integration

## Authentication layer

The app currently uses `findFirstAthleteProfile()` throughout — all data
belongs to a single athlete. Before multi-user support or external OAuth flows:

- Replace all `findFirstAthleteProfile()` calls with an authenticated user
  context (JWT or session)
- Add proper user isolation at the service layer
- This is a prerequisite for any Phase 9 OAuth integration

## Drag-and-drop workout scheduling

Open issue #18 (back-to-top) touched this concern. Drag-and-drop reordering
of workouts in the Training Plan calendar view is a natural Phase 9 quality-of-life
addition after the data model is stable.

## Advanced training load analytics

Phase 8 adds weekly volume and sport distribution charts. Future analytics:

- Acute/chronic training load ratio (last 7 days vs last 28 days)
- Monotony and strain calculations
- Load trend week-over-week comparison
- Recovery signals (when Garmin data is available: HRV, sleep, readiness)

These require a more sophisticated analytics service and potentially a
persisted daily-load model.

## Workout export

Export to Zwift workout format (.zwo), Garmin TCX, or calendar (.ics) —
planned for Phase 11 per roadmap.

## CompletedWorkoutLink many-to-many (Phase 10)

Phase 8 implements plan fulfillment as a nullable `activityId` FK on
`PlannedWorkout` (one-to-one). If one activity should fulfill multiple planned
workouts, or if confidence-scored auto-matching is needed, a separate
`CompletedWorkoutLink` junction table is the right model.

Revisit in Phase 10 after triathlon training data is regularly imported and
the one-to-one model shows limitations.

## Prompt versioning

`promptVersion` field on `AiCoachOutput` is defined in the schema but never
set. Add versioning only when prompt reproducibility matters for debugging
real AI output. Currently the mock provider makes this low-priority.

## Back-to-top UI revisit

Issue #18 (back-to-top button) not yet assigned to a phase. Revisit when
pages grow long enough that scrolling back to the top becomes friction.
