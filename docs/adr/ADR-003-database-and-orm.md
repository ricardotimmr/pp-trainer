# ADR-003: Database and ORM

Status: Accepted

Date: 2026-06-20

## Context

`pp-trainer` needs persistent storage for a source-agnostic internal training
model. The database must support:

- single-user athlete profile and settings
- training goals and availability
- training zones
- completed activities with optional sport-specific metrics
- activity laps, swim laps, strength sets and time-series samples where needed
- training plans, planned workouts and workout steps
- performance stats and race predictors
- import metadata and raw data references
- future AI coach outputs and athlete context snapshots

The data model is relational, but it also contains some flexible source payloads
and structured snapshots. The MVP must support optional fields because Garmin,
manual files, JSON imports and future sources will not provide identical data.

## Decision

Use **PostgreSQL** as the database and **Prisma** as the ORM/migration tool.

Prisma owns:

- schema definition in `prisma/schema.prisma`
- migrations
- generated type-safe client
- local seed workflow

PostgreSQL is the default persistence target for local MVP development and
future deployment.

Core database design rules:

- Model the internal app domain, not Garmin-specific objects.
- Keep raw/import data separate from canonical activity/planning data.
- Use enums for stable internal categories such as sport, source type, workout
  status, goal priority and import status.
- Allow optional metrics where data source coverage differs.
- Add indexes for common read paths: athlete, activity start time, sport,
  training plan date range, workout schedule date and import/deduplication
  fields.
- Add unique constraints for obvious deduplication paths such as source +
  external ID or file hash where appropriate.
- Use JSON fields only for data that is intentionally flexible, source-shaped or
  snapshot-like. Do not hide core query fields in JSON.

API DTOs are separate from Prisma models.

## Consequences

- The schema can represent the internal training model independently from
  Garmin, Strava or any parser library.
- Prisma provides useful generated types for backend code, but those types stay
  backend-internal.
- Migrations become part of normal development and must be tested before import
  and AI work depends on them.
- PostgreSQL-specific behavior such as JSON columns and constraints can be used
  where useful.
- Time-series data can grow quickly; Phase 3 should model it carefully and avoid
  loading it in list endpoints.
- Raw data retention is possible for debugging and reprocessing, but UI and AI
  should consume normalized entities.
- Local setup must document `DATABASE_URL`, migration and seed commands.

## Alternatives Considered

### SQLite

Rejected for the main MVP path because later imports, relational queries and
PostgreSQL deployment behavior should be exercised early. SQLite can still be
considered for isolated tests if it does not hide PostgreSQL-specific behavior.

### Drizzle ORM

Drizzle is lightweight and explicit, but Prisma is a better fit for the current
planning docs, generated client workflow and migration needs.

### Direct SQL only

Rejected for Phase 3 because the project benefits from a typed schema/client
while the domain model is being translated from Phase 2 mock data.
