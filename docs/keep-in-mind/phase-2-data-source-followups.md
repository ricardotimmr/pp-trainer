# Phase 2 Data Source Follow-Ups

These notes capture implementation decisions that were intentionally deferred
while working on issue #28.

## View-model helpers

Do not add large page-level view-model helpers in the first data-source audit
pass.

Deferred examples:

- `getSettingsViewModel()`
- `getAiCoachViewModel()`
- `getDashboardViewModel()`

Reason: the first pass should establish the data ownership boundary and remove
direct page imports from raw mock data. Page-specific view models should only be
introduced after the pages are using helpers/context consistently and repeated
data composition is clearly visible.

Recommended revisit point: after tasks 1-3 from
`docs/temp-todos/issue-28-data-source-audit-plan.md` are complete.

## Object cloning depth

Collection helpers should return new arrays so callers do not mutate shared
mock arrays by accident.

Single-object helpers currently return the prototype object directly. That is
acceptable for the Phase 2 read-mostly prototype, but should be revisited if
pages start mutating nested profile, performance or plan objects directly.

Potential future options:

- return shallow clones for single records
- add explicit update methods in prototype context
- keep helpers read-only and move all editable state into context

## Fixture query persistence across navigation

Issue #30 uses an env-gated query parameter such as
`?fixture=dashboard_empty` for route-level empty-state fixtures.

This works well when a fixture route is opened directly, which is enough for
the planned e2e coverage. One limitation remains: in-app navigation currently
does not preserve the fixture query parameter automatically.

If future demo or test flows need to navigate from one fixture route to another
while keeping the same fixture active, revisit one of these options:

- preserve the `fixture` query parameter in app navigation helpers
- move fixture selection into a small session-level fixture context
- use separate Playwright projects or web server env values per fixture

Do not add this until a cross-route fixture flow actually needs it.

## No active training plan state

Issue #30 currently covers an empty week plan: an active training plan exists,
but it has no scheduled workouts.

Keep the separate `no active training plan` product state in mind for a later
follow-up. That state means no active plan exists at all, which affects
Dashboard, Training Plan and AI Coach differently than an empty week.

This will likely matter for:

- new users before the first plan is generated
- completed or archived plans
- import-first flows where no AI plan exists yet
- AI Coach messaging before a plan can be created

Do not add it to #30 unless the page contracts are ready for
`getCurrentTrainingPlan()` to return no active plan.
