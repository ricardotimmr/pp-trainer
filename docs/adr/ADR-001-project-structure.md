# ADR-001: Project Structure

Status: Accepted

Date: 2026-06-20

## Context

`pp-trainer` started as a frontend prototype, but the product roadmap requires a
fullstack application with a backend API, PostgreSQL database, shared
TypeScript types and a source-agnostic import pipeline.

The architecture documents define a clear separation between:

- frontend presentation and user interaction
- backend API, validation, import, AI and persistence logic
- shared DTOs and schemas
- Prisma database schema and migrations
- product/architecture documentation

The app is a single-user MVP first, but it must not be structured in a way that
blocks later expansion to imports, AI generation, additional data sources or
multi-user support.

## Decision

Use a workspace-based monorepo with these top-level areas:

```txt
pp-trainer/
├── apps/
│   ├── web/       React + Vite + TypeScript frontend
│   └── api/       Node.js + TypeScript backend
├── packages/
│   └── shared/    shared DTOs, schemas, enums and utilities
├── prisma/        Prisma schema, migrations and seed entrypoints
├── docs/          product docs, ADRs and implementation planning
└── package.json   root workspace scripts
```

The frontend stays in `apps/web`. The backend will be implemented in
`apps/api`. Shared types and schemas may move into `packages/shared`, but only
when they are stable API/domain contracts used by both sides.

Prisma models are backend/database internals. They must not be used as the
frontend contract. The frontend consumes API DTOs.

Local-only project notes can live under `docs/local/`, which is intentionally
git-ignored. Durable architecture decisions belong in `docs/adr/`.

## Consequences

- The repository can evolve as a fullstack app without splitting projects.
- Root scripts can orchestrate frontend, backend, shared package and e2e checks.
- Frontend and backend dependencies stay isolated by workspace.
- Shared code is available when useful, but is not a dumping ground for every
  type.
- The API boundary remains explicit: database schema -> repository -> service
  -> DTO -> frontend.
- Phase 3 must add real package setup for `apps/api` and `packages/shared`.
- Future phases can add import workers or adapters without restructuring the
  frontend app.

## Alternatives Considered

### Separate repositories

Rejected for the MVP because it would add coordination overhead before the
backend/API contract is stable.

### Frontend-only app with local data modules

Rejected after Phase 2. It was useful for UI prototyping, but cannot support
real imports, PostgreSQL persistence, AI provider security or backend-owned
validation.

### Export Prisma models directly to frontend

Rejected because it couples UI contracts to database internals and makes schema
evolution harder.
