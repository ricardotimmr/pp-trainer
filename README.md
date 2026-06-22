# pp-trainer

`pp-trainer` is a personal training analysis and planning tool for triathletes. The product concepts, architecture, data model, data-source strategy, AI coach concept, and roadmap live in `docs/` and are the source of truth for implementation decisions.

## Current Status

**Phase 3: Backend and Database Foundation — complete**

The backend API, PostgreSQL database, migrations, and seed layer are fully operational. The frontend prototype from Phase 2 remains the default experience (mock mode) while the backend matures.

**What Phase 3 delivered:**

- Fastify v5 REST API (`apps/api/`) with TypeScript and ESM
- PostgreSQL database via Prisma v7 and Docker Compose
- Full migration history and rich seed dataset (athlete, goals, zones, activities, training plan, performance stats, import placeholders, AI coach foundation)
- Zod DTO schemas in `packages/shared/` shared across API and frontend
- Read endpoints for all Phase 2 data domains
- Import metadata foundation (history read, upload placeholder returning 501 until Phase 4)
- Athlete context builder (`GET /api/athlete/context`, `POST /api/athlete/context/snapshot`)
- Frontend API client layer with explicit `VITE_DATA_MODE=mock|api` switch
- Activities page migrated to optional API mode as the first real data proof
- Quality gate: `npm run check` covers shared build, API typecheck, lint, tests and seed validation
- GitHub Actions CI (no database required — all API tests use in-process mocks)

**What is still mock-only (Phase 4+):**

All pages except Activities read from `apps/web/src/mock/` prototype helpers. No real file import or AI generation exists yet.

## Repository Structure

```txt
pp-trainer/
├── apps/
│   ├── api/          Fastify v5 REST API (Phase 3+, active)
│   └── web/          React + Vite + TypeScript frontend
├── packages/
│   └── shared/       Shared Zod schemas and TypeScript DTO types
├── docs/             Product docs, ADRs, brand assets
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.ts       Entry point — run via npm run db:seed
│   └── seed/         Seed mappers and validation script
├── .github/
│   └── workflows/ci.yml
├── README.md
└── package.json
```

## Getting Started

Install all dependencies from the repository root:

```bash
npm install
```

### Frontend only (mock mode, no backend needed)

```bash
npm run dev
```

Open `http://127.0.0.1:5173`. All data comes from `apps/web/src/mock/`. No database or backend required.

### Full stack (API + frontend)

**1. Start PostgreSQL:**

```bash
npm run db:up
```

**2. Copy and configure the API environment:**

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and set `DATABASE_URL` to point at the running PostgreSQL instance (the default in `.env.example` matches the Docker Compose config).

**3. Run migrations and seed:**

```bash
npm run db:migrate
npm run db:seed
```

**4. Start the API server:**

```bash
npm run dev:api
```

API runs at `http://127.0.0.1:3000`.

**5. Start the frontend in API mode:**

```bash
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env and set VITE_DATA_MODE=api
npm run dev:web
```

Open `http://127.0.0.1:5173`. The Activities page now reads from the local backend. All other pages remain in mock mode.

## Environment Variables

### `apps/api/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `API_HOST` | no | `127.0.0.1` | Host the API binds to |
| `API_PORT` | no | `3000` | Port the API listens on |
| `WEB_ORIGIN` | no | `http://127.0.0.1:5173` | Allowed CORS origin |

### `apps/web/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_DATA_MODE` | no | `mock` | `mock` or `api` — controls data source |
| `VITE_API_BASE_URL` | no | `http://127.0.0.1:3000` | Backend base URL (only used in `api` mode) |
| `VITE_ENABLE_PROTOTYPE_FIXTURES` | no | `false` | Enables `?fixture=` query param for empty-state testing |

Both `.env` files are git-ignored. Only `.env.example` files are committed.

## API Endpoint Overview

All endpoints return `{ error: { code, message } }` on failure.

### System

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check — returns `{ status: "ok" }` |

### Athlete

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/athlete/profile` | Athlete profile with thresholds and availability |
| `GET` | `/api/athlete/context` | Full structured context object (v1) for AI Coach |
| `POST` | `/api/athlete/context/snapshot` | Persist current context snapshot — returns 201 |

### Activities

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/activities` | Activity list (summary). Query params: `sport`, `activityType`, `from`, `to` |
| `GET` | `/api/activities/:id` | Full activity detail with laps, zones and metric samples |

### Training

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/training-plans/current-week` | Active training plan with all planned workouts and steps for the current week |
| `GET` | `/api/training-plans/:id` | Training plan by ID |
| `GET` | `/api/workouts/:id` | Planned workout by ID with steps |

### Performance

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/performance` | Sport metrics and race predictions |

### Import

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/import/history` | Import file history with status and activity count |
| `POST` | `/api/import/upload` | **501 Not Implemented** — placeholder until Phase 4 |

## Mock Mode vs API Mode

The frontend has two data modes controlled by `VITE_DATA_MODE`:

**`mock` (default)** — all pages read from `apps/web/src/mock/prototypeData.helpers.ts`. No backend or database needed. This is the safe default during development.

**`api`** — the Activities page fetches from `GET /api/activities` via the API client in `apps/web/src/api/`. Loading and error states are handled. All other pages still read from mock helpers until they are migrated in a future phase.

The switch is intentionally explicit — setting `VITE_DATA_MODE=api` with no backend running shows a clear error state rather than silently falling back to mock data.

## Database

### Seed scenarios

```bash
# Default seed — full prototype dataset
npm run db:seed

# Empty-plan scenario — omits training plan, workouts and steps
PP_SEED_SCENARIO=no-active-plan npm run db:seed
```

The seed truncates all app tables before inserting. Only run against the local development database.

### Reset and reseed

```bash
# Drop volume, restart container, run migrations (data loss)
npm run db:reset

# Same as above plus default seed
npm run db:reset:seed
```

### Other database commands

```bash
npm run db:up           # Start PostgreSQL container
npm run db:down         # Stop container (data preserved)
npm run db:migrate      # Run pending migrations
npm run db:studio       # Open Prisma Studio
npm run db:validate     # Validate schema syntax
npm run db:validate:seed  # Validate seed payload structure (no DB needed)
```

## Quality Gate

Run the full local quality gate before merging:

```bash
npm run check
```

This runs in sequence:
1. `build:shared` + `typecheck:shared` — shared package compiles cleanly
2. `typecheck:api` — API TypeScript is clean
3. `lint:api` — no ESLint errors
4. `test:api` — all 155 unit tests pass (no database required)
5. `db:validate:seed` — seed payload structure is internally consistent

CI (GitHub Actions) runs the same steps on every push and pull request to `main`.

## Roadmap

```txt
Phase 0   Project Foundation          done
Phase 1   Repo and App Foundation     done
Phase 2   Frontend Prototype          done
Phase 3   Backend and Database        done
Phase 4   Activity Import             upcoming
Phase 5   Training Planning Core      upcoming
Phase 6   AI Coach MVP                upcoming
Phase 7   MVP Integration             upcoming
```

Full roadmap: `docs/07-roadmap.md`

## What Phase 4 Should Build Next

Phase 4 picks up from the `POST /api/import/upload` placeholder (currently 501):

- Real FIT/GPX/TCX parser writing to `ImportedFile` + `RawActivityData`
- Activity normaliser writing to `Activity` + related tables
- Duplicate detection based on `externalId`
- Garmin or manual upload flow in the frontend
- Import status polling or webhook
- Seed dataset replaced or extended by real imported data
