# pp-trainer

`pp-trainer` is a training analysis and planning project. Phase 1: Repo and App Foundation is complete.

The product concepts, architecture, data model, data-source strategy, AI coach concept, and roadmap live in `docs/` and are the source of truth for implementation decisions.

## Current Status

Phase 0 documentation is available in `docs/`.

Phase 1 prepared the technical foundation:

- monorepo-style repository layout
- React + Vite + TypeScript frontend under `apps/web`
- empty backend area under `apps/api`
- empty shared TypeScript package area under `packages/shared`
- Prisma folder prepared for later database work
- ADR folder prepared for upcoming technical decisions
- root scripts for frontend development, build, linting, and formatting

No product features are implemented yet. Dashboard features, activity import, Garmin integration, AI coach logic, database implementation, auth, and training planning are intentionally out of scope until their roadmap phases.

The next roadmap step is Phase 2: Frontend Prototype with Mock Data.

## Repository Structure

```txt
pp-trainer/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── shared/
├── docs/
│   └── adr/
├── prisma/
├── README.md
├── package.json
└── .env.example
```

## Getting Started

Install dependencies from the repository root:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Equivalent explicit command:

```bash
npm run dev:web
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

## Environment

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Only placeholder values are committed. Real secrets must stay out of Git.

## Next Work

- Phase 2: build the first frontend prototype with mock data.
- Keep ADRs updated when technical decisions are made.
- Add backend and shared package manifests only when their implementation phases begin.
