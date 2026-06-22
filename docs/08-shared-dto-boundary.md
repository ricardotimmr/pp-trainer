# Shared DTO Boundary

Phase 3 introduces `packages/shared` as the public contract layer between the
backend and frontend.

The shared package owns API-facing DTO schemas and inferred TypeScript types.
Prisma models, Prisma enum members and repository/service implementation details
remain backend-internal.

## Ownership

- `packages/shared` owns DTO schemas and DTO types.
- `apps/api` will map Prisma records into shared DTOs in later Batch B/C work.
- `apps/web` will consume shared DTOs when frontend API data mode is introduced.
- `prisma/schema.prisma` remains the database implementation model, not the
  frontend contract.

## Schema Conventions

- DTO schemas use Zod.
- DTO enum values use source-agnostic app strings such as `cycling`,
  `main_goal`, `heart_rate` and `ai_generated`.
- Prisma enum members can remain `PascalCase`; backend mappers translate between
  Prisma values and DTO values.
- Dates that are date-only in product UI should be exposed as date strings in
  DTOs, even if Prisma stores them as `DateTime`.
- Optional source metrics stay optional. DTOs should not invent fake defaults.

## Current Training Plan Semantics

`currentTrainingPlan` can be `null`.

That means there is no active/current plan for the athlete and should be handled
as a normal empty state, not as a not-found or server error.

This is distinct from an active plan that exists but has zero scheduled
workouts.

## Deferred Boundaries

- API error response shape belongs to P3-006.
- Prisma-to-DTO mapper placement belongs to P3-006.
- Concrete read routes belong to P3-007 through P3-011.
- Frontend API data-mode integration belongs to P3-013.
- `WeeklySummary` remains a computed service/API DTO until analytics snapshot
  needs are clearer.
