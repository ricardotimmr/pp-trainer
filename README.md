# pp-trainer

`pp-trainer` is a personal training analysis and planning tool for triathletes. The product concepts, architecture, data model, data-source strategy, AI coach concept, and roadmap live in `docs/` and are the source of truth for implementation decisions.

## Current Status

**Phase 2: Frontend Prototype with Mock Data — in progress**

A fully navigable frontend prototype is being built with static mock data. No backend, database, or real data sources are connected yet. The goal is to validate screens, data flows, and UI components before implementing the backend stack.

Pages currently implemented:

- **Home** — landing and entry point
- **Dashboard** — weekly summary, upcoming workouts, recent activities
- **Training Plan** — full week view with planned workouts
- **Workout Detail** — session structure, steps, intensity breakdown
- **Activities** — activity list with filters
- **Activity Detail** — laps, zones, charts, performance breakdown
- **Performance** — stats, race predictions, trends
- **AI Coach Preview** — two-column layout with athlete context and generated output
- **Import** — data source status, pipeline overview, import history
- **Settings** — athlete profile, performance baselines, training zones

A `/dev/ui-showcase` route exposes the component library for design review.

All data is served from `apps/web/src/mock/`. An env-gated fixture system (`VITE_ENABLE_PROTOTYPE_FIXTURES`) allows route-level empty-state testing via query parameter.

## Repository Structure

```txt
pp-trainer/
├── apps/
│   ├── web/          React + Vite + TypeScript frontend
│   └── api/          Backend area (Phase 3+)
├── packages/
│   └── shared/       Shared TypeScript package (Phase 3+)
├── docs/             Product docs, ADRs, brand assets
├── prisma/           Schema prepared for Phase 3
├── README.md
├── package.json
└── .env.example
```

## Getting Started

Install dependencies from the repository root:

```bash
npm install
```

Start the frontend dev server:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Check formatting:

```bash
npm run format:check
```

Run Playwright e2e tests:

```bash
npm run test:e2e
```

## Environment

```bash
cp .env.example .env
```

Only placeholder values are committed. Real secrets must stay out of Git.

## Local Database

The local PostgreSQL database runs via Docker Compose.

Start PostgreSQL:

```bash
npm run db:up
```

Run Prisma migrations:

```bash
npm run db:migrate
```

Seed the default Phase 2 prototype baseline:

```bash
npm run db:seed
```

The default seed inserts the rich prototype dataset: athlete profile, goals,
training availability, training zones, activities with detail data, performance
metrics, import placeholders, AI Coach foundation data, the active training plan,
planned workouts and workout steps.

Seed the empty-current-plan scenario:

```bash
PP_SEED_SCENARIO=no-active-plan npm run db:seed
```

This keeps athlete, goals, zones, activities, performance, import placeholders
and AI foundation data, but omits active training plan, planned workout and
workout step records. Use it for backend DTO/API empty-state checks.

Stop PostgreSQL without deleting data:

```bash
npm run db:down
```

Reset PostgreSQL and re-run migrations:

```bash
npm run db:reset
```

Reset PostgreSQL, re-run migrations and seed the default baseline:

```bash
npm run db:reset:seed
```

Database data is stored in a named Docker volume. Stopping the API or stopping
the container does not delete data. `db:reset` removes the volume and starts
from a clean database.

`db:seed` truncates app tables with PostgreSQL `TRUNCATE ... CASCADE` before
inserting seed data. Use it only against the local development database.

## Roadmap

```txt
Phase 0   Project Foundation          done
Phase 1   Repo and App Foundation     done
Phase 2   Frontend Prototype          in progress
Phase 3   Backend and Database        upcoming
Phase 4   Activity Import             upcoming
Phase 5   Training Planning Core      upcoming
Phase 6   AI Coach MVP                upcoming
Phase 7   MVP Integration             upcoming
```

Full roadmap: `docs/07-roadmap.md`
