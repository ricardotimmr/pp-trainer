# Phase 3 Backend and Seed Followups

These notes came out of the completed P3-003/P3-004 local planning files. They
are not blockers for the current schema or seed baseline, but they should be
remembered when implementing later Phase 3/4 backend work.

## Seed Scenarios

- `PP_SEED_SCENARIO=no-active-plan` exists specifically for future DTO/API
  empty-state verification.
- Use it when implementing read APIs for Dashboard, Training Plan and AI Coach
  context so `currentTrainingPlan: null` is tested as a normal product state.
- Do not mix frontend query-param fixture behavior into database seed behavior.

## Import Placeholders

- P3-004 seeds import history and raw-data placeholder rows as source/import
  metadata only.
- Do not assume these rows are already canonical import execution results.
- P3-011 should decide when and how `ImportedFile` / `RawActivityData` rows get
  linked to created activities after real parsing, validation and deduplication
  behavior exists.

## AI Context Storage

- Athlete/input context belongs in `AthleteContextSnapshot`.
- `AiCoachOutput.structuredOutput` should stay focused on output-shaped data and
  created entity references.
- Revisit this split in the Athlete Context Builder and AI Coach MVP work, but
  do not move input context into output records by default.

## Service-Layer Constraints

- Active training-zone-set uniqueness is not enforced with a database partial
  unique index in the baseline schema.
- If Settings/API mutations allow changing active zone sets, enforce "only one
  active set per athlete/sport/zone type" in the service layer.

## Seed Reset

- `db:seed` intentionally uses PostgreSQL `TRUNCATE ... CASCADE` for local
  development reliability.
- Keep it local-only. Do not reuse this reset strategy for production or shared
  environments.
