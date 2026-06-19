# Phase 2 Remaining Issue Plan

Local working order after the Phase 2 final review cleanup.

## Recommendation

Do these before closing Phase 2:

1. #28 - FE: Audit and unify Phase 2 prototype data sources
2. #30 - FE: Add route-level empty-state fixtures for Phase 2 prototype

Do not treat these as required Phase 2 closure work:

- #29 - FE: Extract shared zone visualisation components
- #18 - UI: Revisit back-to-top interaction

Administrative cleanup:

- #12 - FE-010 AI Coach Preview Page
- #13 - FE-011 Settings Page
- #14 - FE-012 Import Page
- #23 - FE-016 Performance Stats Page

These implementation issues appear open, but the corresponding pages have been
implemented and covered by smoke tests. They should be reviewed, moved out of
Backlog/Review as appropriate, and closed once the GitHub board state is
confirmed.

## Phase 2 Closure Order

### 1. #28 - Audit and unify Phase 2 prototype data sources

- GitHub: https://github.com/ricardotimmr/pp-trainer/issues/28
- Do in Phase 2: Yes
- Order: First
- Reason: This defines the data ownership model for the remaining prototype.

This should be handled before adding empty-state fixtures, because fixtures
should be injected through the same data layer the app actually uses.

Expected output:

- Document which page consumes which data groups.
- Decide what belongs to athlete context, goals, performance stats, zones and
  activity-specific data.
- Remove remaining direct mock imports where a shared helper/context should own
  the data.
- Update or create local docs describing the final Phase 2 prototype data model.

### 2. #30 - Add route-level empty-state fixtures for Phase 2 prototype

- GitHub: https://github.com/ricardotimmr/pp-trainer/issues/30
- Do in Phase 2: Yes
- Order: Second, after #28
- Reason: Phase 2 should prove that main pages handle partial data before real
  import work starts.

This should use the fixture strategy that comes out of #28.

Recommended minimum coverage:

- Dashboard with no upcoming workouts and/or no recent activities.
- Import page with no recent import history.
- Performance page with no race predictors for one sport.
- Settings / AI Coach with optional thresholds missing.
- Training Plan with empty or unavailable plan data, if the route can support
  that cleanly.

Expected output:

- A small fixture strategy, not page-specific hacks.
- Route smoke tests for selected empty/limited states.
- Existing happy-path e2e tests stay green.

## Defer

### #29 - Extract shared zone visualisation components

- GitHub: https://github.com/ricardotimmr/pp-trainer/issues/29
- Do in Phase 2: Not required for closure
- Recommended timing: After #28, only if #28 shows that Settings and
  Performance should share real UI components.

We already extracted shared zone colors and formatting helpers. A shared
`ZoneBand` / `ZoneList` component should wait until the data ownership audit
confirms that the zone views have matching semantics.

### #18 - Revisit back-to-top interaction

- GitHub: https://github.com/ricardotimmr/pp-trainer/issues/18
- Do in Phase 2: No
- Recommended timing: Later UI polish pass

This is low-priority visual interaction work and should not block Phase 2.

## Administrative Issue Review

These issues still appear open but correspond to implemented Phase 2 pages:

- #12 - AI Coach Preview Page
- #13 - Settings Page
- #14 - Import Page
- #23 - Performance Stats Page

Recommended handling:

1. Verify each issue against the current app and e2e coverage.
2. Move them out of Backlog/Review according to the project board workflow.
3. Close them after any manual review notes are resolved.

## Not Needed Before Phase 2 Closure

- More visual nav architecture work. Compact nav is now smoke-covered.
- Shared zone UI components unless #28 exposes a concrete need.
- Back-to-top interaction.
- Real import, backend persistence, Garmin sync or AI integration.
