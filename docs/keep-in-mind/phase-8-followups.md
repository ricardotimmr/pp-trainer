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
