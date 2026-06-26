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
