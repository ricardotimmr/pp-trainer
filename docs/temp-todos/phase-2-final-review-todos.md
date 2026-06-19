# Phase 2 Final Review Todos

Local temporary review after completing the Phase 2 frontend prototype.

Verification run:

- `npm run build` passes
- `npm run test:e2e` passes for Activity Detail and Phase 2 route smoke
  coverage
- `npm run lint` passes with one existing Fast Refresh warning in
  `WorkoutStepList.tsx`

## Priority 1 — Fix Before Closing Phase 2

### Fixed: lint no longer fails on page transition state handling

- Category: Bugs / CI readiness
- Files: `apps/web/src/App.tsx`
- Area: route transition `useEffect`
- Priority: P1
- Status: Fixed on 2026-06-19

`npm run lint` previously failed because `setPhase('exit')` was called
synchronously inside an effect. The transition now derives `phase` from
`pathname !== displayedPath` and commits the route swap after the exit timer via
a reducer action.

Follow-up: none for this item. The remaining lint output is the separate Fast
Refresh warning listed under Priority 3.

### Fixed: active goal helper now respects priority model

- Category: Bugs / AI Coach context
- Files:
  - `apps/web/src/mock/prototypeData.helpers.ts`
  - `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/pages/AiCoachPreviewPage.tsx`
- Priority: P1
- Status: Fixed on 2026-06-19

Phase 2 supports multiple active goals with `main_goal`, `secondary_goal` and
`watchlist`. This previously relied on the first active goal in mock data.

Implemented central helpers:

- `getActiveTrainingGoals()`
- `getMainTrainingGoal()`
- `getSecondaryTrainingGoals()`
- `getWatchlistTrainingGoals()`

`getActiveTrainingGoal()` now resolves to the main goal for backwards-compatible
Dashboard summary use. Dashboard shows secondary/watchlist counts, and AI Coach
renders separate Main, Secondary and Watchlist context blocks.

### Fixed: Performance swimming zone bar no longer leaves misleading empty grey segments

- Category: Bugs / Data visualisation
- Files:
  - `apps/web/src/pages/PerformancePage.tsx`
  - `apps/web/src/App.css`
- Priority: P1
- Status: Fixed on 2026-06-19

`performance-zone-band` was effectively designed around five zones. Swimming
had three pace zones, so the bar displayed unused grey space that looked like
missing data.

Implemented:

- added `swim-pace-z4` as `VO2 Max` to the swimming pace mock zones
- rendered `performance-zone-band` columns from `zones.length`
- verified `/performance` visually so the swimming bar now has four complete
  equal segments and no grey tail

### Fixed: keyboard focus is visible in main navigation

- Category: Bugs / Accessibility
- Files: `apps/web/src/App.css`
- Area:
  - `.app-shell__brand:focus-visible`
  - `.app-shell__compact-brand:focus-visible`
  - `.app-shell__nav-button:focus-visible`
  - `.app-shell__menu-button:focus-visible`
- Priority: P1
- Status: Fixed on 2026-06-19

The CSS removed focus outlines for the main nav and brand controls without
adding a custom visible replacement.

Implemented a consistent focus-visible underline pattern:

- default brand logo uses its existing pink dashed underline
- nav buttons reveal the same underline used for hover
- compact logo and menu button get matching underline pseudo-elements
- compact/dark nav state switches the underline to the existing light variant

## Priority 2 — Important Follow-Ups

### Fixed: smoke tests cover all Phase 2 top-level routes

- Category: Test coverage
- Files:
  - `apps/web/e2e/phase-2-routes.spec.ts`
  - `playwright.config.ts`
- Priority: P2
- Status: Fixed on 2026-06-19

Current e2e coverage previously only covered Activity Detail branches. Added a
dedicated top-level route smoke spec for:

1. `/dashboard` renders the current week and active goal.
2. `/training-plan` renders the week plan and links to a workout.
3. `/ai-coach` renders week plan and single workout tabs.
4. `/settings` renders athlete context, goals and zones.
5. `/import` renders disabled upload, source strategy and pipeline.
6. `/performance` renders Running, Roadbike and Swimming sections.
7. Navigation can reach `/performance` from the primary nav.

This should catch broken routes, hidden nav regressions and missing mock-data
branches before the next phase.

### Fixed: Performance stats use sport-specific VO2 and measurement metadata

- Category: Data model / AI Coach context
- Files:
  - `apps/web/src/mock/prototypeData.types.ts`
  - `apps/web/src/mock/prototypeData.ts`
  - `apps/web/src/pages/PerformancePage.tsx`
- Priority: P2
- Status: Fixed on 2026-06-19

`PerformanceStats` previously had one global `vo2maxEstimate`, which the
Performance page repeated for running and cycling while swimming showed `n/a`.

Implemented sport-scoped performance metrics under `PerformanceStats.bySport`:

- Running now has its own VO2 max, threshold HR and threshold pace metadata.
- Roadbike now has its own VO2 max, threshold HR and FTP metadata.
- Swimming now has threshold HR and threshold pace metadata without a fake VO2
  metric.

This prevents the Performance page and later AI Coach context from treating one
generic VO2 value as universal truth.

### Fixed: Performance race predictors show sport-specific secondary metrics

- Category: UX / Data usefulness
- Files: `apps/web/src/pages/PerformancePage.tsx`
- Priority: P2
- Status: Fixed on 2026-06-19

Running predictors showed pace, cycling showed speed, but swimming predictors
fell back to the estimate date.

Implemented:

- swimming predictors derive pace per 100m from `predictedDurationSeconds` and
  `distanceMeters`
- all predictor cards keep the measurement date as a small secondary timestamp

### Partially fixed: Settings prototype edits feed AI Coach session context

- Category: Product consistency / AI Coach context
- Files:
  - `apps/web/src/context/PrototypeAthleteContext.tsx`
  - `apps/web/src/context/prototypeAthleteContextValue.ts`
  - `apps/web/src/pages/SettingsPage.tsx`
  - `apps/web/src/pages/AiCoachPreviewPage.tsx`
  - `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/e2e/phase-2-routes.spec.ts`
- Priority: P2
- Status: Partially fixed on 2026-06-19
- Follow-up: GitHub issue #28

Settings lets the user toggle focused sports, remove/add active goals and change
goal priorities locally. AI Coach and Dashboard previously read static mock
data, so those changes did not affect the displayed coach context.

Implemented a session-local `PrototypeAthleteProvider`:

- initial state still comes from mock data
- Settings writes focused sports, active goals and goal priorities to the shared
  context
- AI Coach reads athlete sports and goal context from the same source
- Dashboard reads the main/secondary/watchlist goal context from the same source
- no backend, localStorage or real persistence is introduced; reload resets to
  the mock defaults

Added an e2e smoke flow that changes Settings and verifies the AI Coach session
context reflects the change.

Remaining scope is tracked in #28: audit all Phase 2 pages and formalize one
prototype data ownership model for athlete profile, goals, training
availability, thresholds, zones, performance stats and activity-derived data.
The session-context fix covers focused sports and goal context, but does not
complete the broader single-source-of-truth cleanup.

### Fixed: Settings dropdowns support Escape-key and focus behavior

- Category: Accessibility / Interaction
- Files:
  - `apps/web/src/pages/SettingsPage.tsx`
  - `apps/web/e2e/phase-2-routes.spec.ts`
- Priority: P2
- Status: Fixed on 2026-06-19

Settings dropdowns previously closed on outside pointer click, but there was no
Escape-key handler and focus was not restored to the trigger after selecting or
closing a menu.

Implemented:

- Escape closes the active Settings menu and restores focus to its trigger.
- Pointer clicks outside Settings menu roots close all open menus.
- Focus leaving the active menu root closes open menus.
- Add-goal, goal-priority and preferred-sport menu triggers now track their
  trigger refs for focus restore.
- E2E coverage verifies Escape closes a custom dropdown and returns trigger
  focus.

### Fixed: Import history uses semantic table markup

- Category: Accessibility / Semantics
- Files:
  - `apps/web/src/pages/ImportPage.tsx`
  - `apps/web/src/App.css`
- Priority: P2
- Status: Fixed on 2026-06-19

The import history was visually table-like and used `role="table"` /
`role="row"`, but cells were plain spans without `role="cell"` /
`role="columnheader"`.

Implemented:

- replaced the ARIA table-like div structure with a semantic `<table>`
- added `thead`, `tbody`, column headers and table cells
- kept the visual styling close to the previous layout
- added compact mobile table labels via `data-label`

## Priority 3 — Useful Enhancements

### Add a dedicated Performance data helper

- Category: Maintainability
- Files:
  - `apps/web/src/mock/prototypeData.helpers.ts`
  - `apps/web/src/pages/PerformancePage.tsx`
- Priority: P3

PerformancePage currently imports `prototypePerformanceStats` and
`prototypeTrainingZoneSets` directly and performs sport grouping in the page.
That works for Phase 2, but real data from python-garminconnect will need a
mapping layer.

Recommended fix: add helpers such as `getPerformanceStats()`,
`getPerformanceSportSections()` or `getTrainingZoneSetsBySport()`. This keeps
the page mostly presentational and gives the real importer a single mapping
target.

### Extract shared zone visualisation logic

- Category: Maintainability / UI consistency
- Files:
  - `apps/web/src/pages/ActivityDetailPage.tsx`
  - `apps/web/src/pages/SettingsPage.tsx`
  - `apps/web/src/pages/PerformancePage.tsx`
- Priority: P3

Zone bars/tables now exist in multiple pages with similar but separate
formatting logic. This is not broken, but the next phase will make zones more
important.

Recommended fix: extract shared helpers/components for:

- zone range formatting
- zone colour selection
- zone band rendering
- compact zone list rendering

Start with `ZoneBar`, then reuse it in Performance and Settings where the
layout fits.

### Improve top navigation scalability after adding Performance

- Category: Navigation / Responsive layout
- Files:
  - `apps/web/src/layout/AppShell.tsx`
  - `apps/web/src/App.css`
- Priority: P3

The compact desktop nav now splits non-home routes as 3 left and 4 right:
Dashboard, Activities, Training Plan | Performance, AI Coach, Settings, Import.
This matches the requested placement, but it should be regression-tested around
tablet widths.

Recommended fix: add a visual/smoke check for the compact nav at common widths
and consider a route metadata field for `compactSide` if the split becomes more
intentional than `slice(0, 3)`.

### Add route-level empty-state fixtures

- Category: Test data / Product resilience
- Files:
  - `apps/web/src/mock/prototypeData.ts`
  - page-specific tests
- Priority: P3

Most pages render the happy path with rich mock data. Activity Detail already
handles unknown IDs well. Other pages would benefit from one or two explicit
empty/limited fixtures:

- no recent imports
- no race predictors for a sport
- no current training plan
- no upcoming workouts
- athlete profile without optional thresholds

This would make real-data integration safer because Garmin/private imports will
often have partial data.

### Fast refresh warning for exported constants

- Category: Developer experience
- Files: `apps/web/src/components/data/WorkoutStepList.tsx`
- Priority: P3

Lint reports a Fast Refresh warning because `WorkoutStepList.tsx` exports
`stepTypeLabels` alongside a component.

Recommended fix: move shared constants to a small adjacent file such as
`workoutStepLabels.ts`. This is not user-facing, but it keeps lint output clean
after the P1 lint error is fixed.

## Suggested Order

1. Fix lint failure in `App.tsx`.
2. Fix goal priority helpers and update Dashboard/AI Coach to use main goal.
3. Fix Performance zone bar column count for non-5-zone sports.
4. Restore visible keyboard focus for main navigation.
5. Add route smoke tests for the full Phase 2 surface.
6. Improve Performance data model for sport-specific VO2/threshold metadata.
7. Connect Settings prototype edits to shared prototype state or make controls
   clearly read-only.
8. Add keyboard behavior to Settings dropdowns.
9. Convert Import history to a semantic table.
10. Extract shared zone components/helpers.
11. Add limited/empty mock fixtures for route resilience.
12. Clean up Fast Refresh warning.
