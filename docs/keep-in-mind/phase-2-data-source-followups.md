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
