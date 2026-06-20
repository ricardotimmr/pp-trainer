# ADR-002: Backend Framework

Status: Accepted

Date: 2026-06-20

## Context

Phase 3 introduces the first real backend for `pp-trainer`.

The backend is responsible for:

- API endpoints for the frontend
- environment and secret handling
- validation and error handling
- Prisma/database access
- source-agnostic import pipeline coordination
- future file uploads and parsing
- future AI provider access
- Athlete Context generation

The app is a single-user MVP first. The backend should therefore be lightweight
and explicit, but still structured enough to keep routes, services and
repositories separated.

The architecture docs listed Fastify and NestJS as candidates.

## Decision

Use **Fastify** with Node.js and TypeScript for the Phase 3 backend.

The backend should be structured around explicit modules:

```txt
apps/api/src/
├── app.ts
├── main.ts
├── config/
├── db/
├── modules/
│   ├── athlete-profile/
│   ├── activities/
│   ├── imports/
│   ├── performance/
│   ├── training-plans/
│   ├── workouts/
│   └── ai-coach/
└── shared/
```

Each module should prefer:

```txt
*.routes.ts       HTTP boundary
*.service.ts      business/use-case logic
*.repository.ts   Prisma/database access
*.mapper.ts       database/domain -> DTO mapping where needed
```

Routes should stay thin. They can parse/validate incoming requests and call a
service. Services own application behavior. Repositories own Prisma queries.

Fastify plugins may be used for cross-cutting concerns such as:

- environment/config
- Prisma client lifecycle
- CORS
- common error handling
- route registration

NestJS is not selected for the current MVP foundation.

## Consequences

- The backend remains small and direct while the domain model is still evolving.
- There is less framework ceremony than NestJS for the first local MVP backend.
- We must enforce module boundaries ourselves through folder structure,
  conventions and tests.
- Dependency injection, if needed, should stay explicit and simple at first.
- Future migration to a heavier backend framework remains possible, but should
  not be planned unless the codebase genuinely needs it.
- Backend errors and validation behavior need to be implemented deliberately,
  not assumed from the framework.
- Phase 3 must add backend test coverage early because Fastify does not impose
  an application architecture by default.

## Alternatives Considered

### NestJS

NestJS provides strong conventions, dependency injection and a larger framework
surface. It is a good option for larger teams and complex APIs, but is heavier
than needed for the current single-user MVP and would slow down the early
backend/database foundation.

### Express

Express is familiar but less type-friendly and less structured for modern
plugin-based TypeScript APIs than Fastify.

### Backendless/frontend-only

Rejected because imports, PostgreSQL persistence, AI provider calls and secrets
must not live in the frontend.
