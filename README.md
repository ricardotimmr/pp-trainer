# pp-trainer

`pp-trainer` is a personal training analysis and planning tool for triathletes. The product concepts, architecture, data model, data-source strategy, AI coach concept, and roadmap live in `docs/` and are the source of truth for implementation decisions.

## Current Status

**Phase 4: Activity Import and Normalization — complete**

The full activity import pipeline is operational. FIT, GPX, TCX binary and XML files are parsed, normalized into the internal activity model, deduplicated and persisted. The JSON import endpoint covers the python-garminconnect integration path. The Dashboard and Import pages are migrated to API mode.

**What Phase 4 delivered:**

- `POST /api/imports/activity-file` — FIT, GPX and TCX file uploads with multipart parsing, storage and pipeline dispatch
- `POST /api/imports/activity-json` — structured JSON import with Zod validation and duplicate detection
- `GET /api/imports` / `GET /api/imports/:id` — import history with status, error messages and file metadata
- FIT parser (`fit-file-parser`), GPX/TCX parser (`fast-xml-parser`) with 5 s metric downsampling
- `ActivityNormalizer` — sport-specific mapping to `Prisma.ActivityUncheckedCreateInput`
- Deduplication layer — exact SHA-256 hash match + similarity check (sport, startTime ±60 s, duration ±5%)
- Dashboard API mode — weekly volume from real activities, no active plan handled gracefully
- Import page API mode — drag-and-drop upload, JSON import, status result blocks, paginated history with filter tabs
- 361 unit and integration tests — all passing without a database

**What is still mock-only (Phase 5+):**

Training plan, workouts, goals, AI coach and performance pages still read from `apps/web/src/mock/` prototype helpers. No create/update/delete mutations for training plans exist yet.

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
| `GET` | `/api/activities` | Activity list (summary). Query params: `sport`, `dateFrom`, `dateTo` |
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
| `POST` | `/api/imports/activity-json` | JSON activity import — full field reference below |
| `POST` | `/api/imports/activity-file` | File upload — `.fit`, `.gpx`, `.tcx` (multipart/form-data, field name `file`) |
| `GET` | `/api/imports` | Import job list. Query params: `status` (`success`\|`failed`\|`duplicate`), `limit` (max 100, default 20), `offset` |
| `GET` | `/api/imports/:id` | Import job detail with file metadata and warning messages |
| `GET` | `/api/import/history` | Phase 3 legacy endpoint — returns seeded import history |

## Mock Mode vs API Mode

The frontend has two data modes controlled by `VITE_DATA_MODE`:

**`mock` (default)** — all pages read from `apps/web/src/mock/prototypeData.helpers.ts`. No backend or database needed. This is the safe default during development.

**`api`** — Activities, Dashboard and Import pages fetch from the backend API. Loading and error states are handled throughout. Training plan, AI coach and performance pages still read from mock helpers until migrated in a future phase.

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
4. `test:api` — all 361 unit tests pass (no database required)
5. `db:validate:seed` — seed payload structure is internally consistent

CI (GitHub Actions) runs the same steps on every push and pull request to `main`.

## Roadmap

```txt
Phase 0   Project Foundation          done
Phase 1   Repo and App Foundation     done
Phase 2   Frontend Prototype          done
Phase 3   Backend and Database        done
Phase 4   Activity Import             done
Phase 5   Training Planning Core      done
Phase 6   AI Coach MVP                upcoming
Phase 7   MVP Integration             upcoming
```

Full roadmap: `docs/07-roadmap.md`

## Phase 4: Activity Import

### Supported import formats

| Format | Endpoint | Notes |
|---|---|---|
| JSON | `POST /api/imports/activity-json` | Structured, source-agnostic — designed as the output format of a python-garminconnect worker |
| FIT | `POST /api/imports/activity-file` | Garmin device binary — parsed via `fit-file-parser` |
| GPX | `POST /api/imports/activity-file` | GPS track XML — namespace-stripped via `fast-xml-parser` |
| TCX | `POST /api/imports/activity-file` | Training Center XML — weighted HR and power extracted |

### JSON import format

#### Minimal working example

```json
{
  "athleteProfileId": "<your-profile-id>",
  "sport": "running",
  "startTime": "2026-06-20T07:30:00Z",
  "durationSeconds": 3600,
  "distanceMeters": 12000,
  "averageHeartRate": 148
}
```

Get your `athleteProfileId` from the seeded database:

```bash
npx prisma studio
# or
psql $DATABASE_URL -c "SELECT id FROM \"AthleteProfile\" LIMIT 1;"
```

#### Full field reference

| Field | Required | Type | Notes |
|---|---|---|---|
| `athleteProfileId` | yes | string | Must match the seeded profile |
| `sport` | yes | string | `running` `cycling` `swimming` `strength` `mobility` `other` |
| `startTime` | yes | ISO 8601 | e.g. `2026-06-20T07:30:00Z` |
| `durationSeconds` | yes | integer > 0 | Total elapsed time |
| `title` | no | string | Activity name |
| `notes` | no | string | Free-text notes |
| `distanceMeters` | no | integer ≥ 0 | |
| `elevationGainMeters` | no | integer ≥ 0 | |
| `averageHeartRate` | no | integer > 0 | |
| `maxHeartRate` | no | integer > 0 | |
| `averagePowerWatts` | no | integer > 0 | Cycling / running power |
| `normalizedPowerWatts` | no | integer > 0 | |
| `averageCadence` | no | number > 0 | rpm or spm |
| `averageSpeedKmh` | no | number > 0 | |
| `calories` | no | integer > 0 | |
| `perceivedExertion` | no | integer 1–10 | RPE |
| `forceImport` | no | boolean | Skip duplicate check (dev/testing only) |

**Cycling power fields** — included in the common table above (`averagePowerWatts`, `normalizedPowerWatts`).

**Swimming-specific fields:**

| Field | Type | Notes |
|---|---|---|
| `poolLengthMeters` | integer > 0 | Pool length in metres |
| `dominantStrokeType` | string | `freestyle` `backstroke` `breaststroke` `butterfly` `mixed` `drill` `other` |
| `totalStrokeCount` | integer > 0 | Total strokes across all laps |
| `swimLaps` | array | See below |

`swimLaps` item: `{ lapNumber, durationSeconds, distanceMeters, strokeType?, strokeCount?, swolfScore?, averagePaceSecPer100m?, averageHeartRateBpm? }`

**Strength-specific fields:**

| Field | Type | Notes |
|---|---|---|
| `totalSets` | integer > 0 | |
| `totalReps` | integer > 0 | |
| `strengthSets` | array | See below |

`strengthSets` item: `{ setNumber, exerciseName?, exerciseCategory?, muscleGroup?, reps?, weightKg?, durationSeconds?, restSeconds?, notes? }`

**Time-series fields** (optional, any sport):

- `laps` — `{ lapNumber, durationSeconds, distanceMeters, averageHeartRateBpm?, maxHeartRateBpm?, averagePaceSecPerKm?, averageSpeedKmh?, averagePowerWatts?, averageCadence?, elevationGainMeters? }`
- `metricSamples` — `{ offsetSeconds, heartRateBpm?, powerWatts?, paceSecPerKm?, speedKmh?, cadenceRpm?, elevationMeters?, latitude?, longitude? }`
- `timeInZones` — `{ zoneNumber, zoneName, durationSeconds, percentage }`

### How to test import locally

#### JSON import

```bash
curl -X POST http://localhost:3000/api/imports/activity-json \
  -H "Content-Type: application/json" \
  -d '{
    "athleteProfileId": "<your-profile-id>",
    "sport": "running",
    "startTime": "2026-06-20T07:30:00Z",
    "durationSeconds": 3600,
    "distanceMeters": 12000
  }'
```

#### File upload

```bash
# FIT file
curl -X POST http://localhost:3000/api/imports/activity-file \
  -F "file=@/path/to/activity.fit"

# GPX file
curl -X POST http://localhost:3000/api/imports/activity-file \
  -F "file=@/path/to/activity.gpx"
```

#### Expected success response (`201`)

```json
{
  "importId": "...",
  "status": "success",
  "activityId": "...",
  "errors": [],
  "warnings": []
}
```

#### Duplicate response (`200`)

```json
{
  "importId": "...",
  "status": "duplicate",
  "activityId": "<existing-activity-id>",
  "errors": [],
  "warnings": ["Activity matches existing record by start time and duration"]
}
```

### Import error reference

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Missing or invalid field — `message` contains field path and reason |
| `INVALID_FILE_TYPE` | 400 | File extension not `.fit`, `.gpx` or `.tcx` |
| `FILE_TOO_LARGE` | 400 | File exceeds `IMPORT_MAX_FILE_SIZE_MB` limit |
| `PARSE_ERROR` | 422 | File could not be parsed — likely wrong format or corrupt |
| `STORAGE_ERROR` | 422 | File could not be written — check `IMPORT_STORAGE_PATH` permissions |
| `FORBIDDEN` | 403 | `athleteProfileId` does not match the active profile |
| `DUPLICATE` (status field) | 200 | Activity already exists — `activityId` in response points to the existing record |

### python-garminconnect bridge

The JSON import format is designed to be the natural output of a python-garminconnect worker. A Python script that exports activity data from Garmin Connect can POST directly to `POST /api/imports/activity-json` with no additional transformation — the format covers all fields the library provides including laps, HR zones and metric samples. The `forceImport` flag is available for re-importing historical exports during development without triggering duplicate detection.

## Phase 5: Training Planning Core

Phase 5 exposes the full write API for training plans and workouts, wires the frontend to real backend data, and adds manual creation and status management UI — all without depending on the AI Coach.

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/training-plans` | List all training plans (summary) |
| `POST` | `/api/training-plans` | Create a training plan |
| `GET` | `/api/training-plans/:id` | Get a full plan with workouts |
| `PUT` | `/api/training-plans/:id` | Update a plan (title, dates, status) |
| `DELETE` | `/api/training-plans/:id` | Delete a plan |
| `GET` | `/api/training-plans/current-week` | Active plan + this week's workouts |
| `GET` | `/api/workouts` | List all workouts across all plans |
| `POST` | `/api/workouts` | Create a workout (with optional steps) |
| `GET` | `/api/workouts/:id` | Get a workout with steps |
| `PUT` | `/api/workouts/:id` | Update a workout or its status |
| `DELETE` | `/api/workouts/:id` | Delete a workout |

### Training plan status values

| Status | Meaning |
|---|---|
| `draft` | Plan is being built, not yet active |
| `active` | The current active plan — only one plan should be active at a time |
| `completed` | Plan period has ended |
| `archived` | Manually archived, no longer relevant |

### Workout status values

| Status | Meaning |
|---|---|
| `planned` | Scheduled but not yet done |
| `completed` | Workout completed as planned |
| `missed` | Scheduled date passed without completion |
| `cancelled` | Explicitly cancelled |
| `moved` | Rescheduled (AI Coach may use this in Phase 6) |
| `adjusted` | Modified from the original plan |

### Create a training plan

```bash
curl -X POST http://localhost:3000/api/training-plans \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Base Phase",
    "startDate": "2026-06-23",
    "endDate": "2026-08-17",
    "status": "active",
    "description": "8-week aerobic base block"
  }'
```

Response `201`:

```json
{
  "id": "plan-uuid",
  "title": "Base Phase",
  "startDate": "2026-06-23",
  "endDate": "2026-08-17",
  "status": "active",
  "source": "manual",
  "plannedWorkouts": []
}
```

### Create a workout with steps

```bash
curl -X POST http://localhost:3000/api/workouts \
  -H "Content-Type: application/json" \
  -d '{
    "trainingPlanId": "plan-uuid",
    "title": "Threshold Tuesday",
    "sport": "running",
    "workoutType": "threshold",
    "scheduledDate": "2026-06-24",
    "plannedDurationSeconds": 3600,
    "intensity": "hard",
    "objective": "Improve lactate threshold pace",
    "steps": [
      { "stepIndex": 0, "stepType": "warmup",   "instruction": "15 min easy", "durationSeconds": 900 },
      { "stepIndex": 1, "stepType": "main",      "instruction": "3 × 10 min at threshold pace", "durationSeconds": 2100,
        "targetPaceLowerSecPerKm": 255, "targetPaceUpperSecPerKm": 265 },
      { "stepIndex": 2, "stepType": "cooldown",  "instruction": "10 min easy", "durationSeconds": 600 }
    ]
  }'
```

Response `201`:

```json
{
  "id": "workout-uuid",
  "trainingPlanId": "plan-uuid",
  "title": "Threshold Tuesday",
  "sport": "running",
  "status": "planned",
  "source": "manual",
  "steps": [
    { "stepIndex": 0, "stepType": "warmup", "instruction": "15 min easy", "durationSeconds": 900 },
    { "stepIndex": 1, "stepType": "main",   "instruction": "3 × 10 min at threshold pace", "durationSeconds": 2100,
      "targetPaceLowerSecPerKm": 255, "targetPaceUpperSecPerKm": 265 },
    { "stepIndex": 2, "stepType": "cooldown","instruction": "10 min easy", "durationSeconds": 600 }
  ]
}
```

### Update workout status

```bash
curl -X PUT http://localhost:3000/api/workouts/<workout-id> \
  -H "Content-Type: application/json" \
  -d '{ "status": "completed" }'
```

Response `200`: updated `PlannedWorkoutDto`.

### Manual training week via curl

```bash
# 1. Create and activate a plan
PLAN=$(curl -s -X POST http://localhost:3000/api/training-plans \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Week","startDate":"2026-06-23","endDate":"2026-06-29","status":"active"}')
PLAN_ID=$(echo $PLAN | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 2. Add a workout to the plan
curl -s -X POST http://localhost:3000/api/workouts \
  -H "Content-Type: application/json" \
  -d "{\"trainingPlanId\":\"$PLAN_ID\",\"title\":\"Easy Run\",\"sport\":\"running\",\"workoutType\":\"endurance\",\"scheduledDate\":\"2026-06-25\",\"plannedDurationSeconds\":2700,\"intensity\":\"easy\",\"steps\":[]}"

# 3. View the current week
curl -s http://localhost:3000/api/training-plans/current-week | jq .
```

### source field

All plans and workouts created through the API in Phase 5 carry `"source": "manual"`. When the AI Coach (Phase 6) creates plans and workouts it will use `"source": "aiCoach"`. This distinction allows the UI to attribute content origin and allows future filtering by source.

### Phase 6 next steps

Phase 6 (AI Coach MVP) will:

- Add `POST /api/ai-coach/generate-plan` which produces `TrainingPlan` + `PlannedWorkout` records using `source: 'aiCoach'`
- Add `POST /api/ai-coach/suggest-workout` for single-session recommendations
- Add `POST /api/context/snapshot` to build and persist the athlete context used in AI prompts
- Introduce stricter workout status transitions (state machine guard) where the current permissive `PUT /api/workouts/:id` approach may need guarding for AI-generated content
