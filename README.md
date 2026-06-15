# pp-trainer

`pp-trainer` is a training analysis and planning project. The current work is Phase 1: Repo and App Foundation.

The product concepts, architecture, data model, data-source strategy, AI coach concept, and roadmap live in `docs/` and are the source of truth for implementation decisions.

## Current Status

Phase 0 documentation is available in `docs/`.

Phase 1 prepares the technical foundation only:

- monorepo-style repository layout
- React + Vite + TypeScript frontend under `apps/web`
- empty backend area under `apps/api`
- empty shared TypeScript package area under `packages/shared`
- Prisma folder prepared for later database work
- ADR folder prepared for upcoming technical decisions

No product features are implemented in this phase. Dashboard features, activity import, Garmin integration, AI coach logic, database implementation, auth, and training planning are intentionally out of scope.

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

## Environment

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Only placeholder values are committed. Real secrets must stay out of Git.

## Phase 1 Open Items

- choose and document the backend framework
- choose and document database and ORM details
- decide the initial styling approach
- prepare backend and shared package manifests when implementation starts
- keep ADRs updated as technical decisions are made
