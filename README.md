# pp-trainer

`pp-trainer` is a personal training analysis and planning tool for triathletes. The product concepts, architecture, data model, data-source strategy, AI coach concept, and roadmap live in `docs/` and are the source of truth for implementation decisions.

## Current Status

**Phase 9: Data Source Expansion — complete. 2026-06-28.**

Activities and health data now flow in automatically from Garmin Connect and Strava. All phases 0–9 are complete.

**What Phase 9 delivered:**

- Garmin Connect sync via `python-garminconnect` — FIT-based activity import + health data (daily summary, sleep, HRV body battery) via Python subprocess bridge
- Strava OAuth2 connect/disconnect + activity sync — OAuth code flow, token refresh, paginated activity fetch with 30-day default window
- Cross-source deduplication hardening — similarity window tightened to ±30s, Strava `sport_type` preferred over deprecated `type`, 8 new cross-source dedup tests
- Sync UI on Import page — Garmin and Strava cards with "Sync now", status, history, toast feedback
- 114 new tests (96 files, 1789 total)

**What Phase 8 delivered:**

- Settings write API — athlete profile PATCH, goals CRUD, training zones CRUD (create/update/delete sets and individual zones)
- SettingsPage live data migration — last page off mock data; fully on real API; `usePrototypeAthleteContext` removed
- DATA_MODE dead code cleanup — dead `mock` branches removed from 5 pages; `config/dataMode.ts` deleted; 3 Phase 2 Playwright spec files deleted
- Analytics service — `GET /api/analytics/weekly-summary` and `GET /api/analytics/sport-distribution`
- Dashboard charts — weekly volume stacked bar chart + sport distribution chart (recharts, empty states handled)
- Plan fulfillment v1 — `activityId` FK on `PlannedWorkout`; link/unlink endpoints; cascade delete guard (409 conflict); Training Plan UI with activity picker modal and force-delete warning
- AI week analysis — `POST /api/ai/generate-week-analysis`; `AiWeekAnalysisPage`; history panel integration; "Analyze this week" trigger on AI Coach page
- AI workout step inline editing — per-step edit form (instruction, duration, distance, reps, zone pickers) on `AiWorkoutPreviewPage` before accepting; modified steps sent as override on accept
- Import history UI — "Past Imports" section on Import page; `GET /api/imports/history`
- Zone picker UI — `ZonePicker` in Create Workout, `AiZonePicker` in AI Workout Preview; sport-filtered HR zones; `useTrainingZones` hook; zone name stored via `step.notes`
- Toast notifications — `sonner` Toaster wired for all key actions (AI accept/reject, status change, delete, import)
- All Workouts filter and search — sport pill filter + title search on Training Plan page (closes #85)

**What Phase 7 delivered:**

- Dashboard fully on real data — athlete profile, goals, planned workouts, completed activity volume, upcoming workout all from live API (`useDashboard` hook with parallel fetches)
- Workout status transition state machine — `validateStatusTransition` in `WorkoutService` enforces valid transitions at the API level (422 on invalid)
- Plan-date alignment validation — `assertDateWithinPlanRange` prevents workouts being assigned outside their plan's date range
- Single active plan DB constraint — partial unique index on `TrainingPlan` prevents multiple active plans per athlete at the DB level
- `GET /api/ai/history` — returns last N AI-generated proposals for the athlete
- Recent proposals panel on AI Coach page — proposal cards show plan/workout title, coach rationale, status badge; clicking navigates to preview
- Zone FK resolution in `AiAcceptService` — AI zone names matched to `TrainingZone` IDs (case-insensitive) when accepting a workout or plan; unmatched zones silently skipped
- AI-accepted week plans auto-activate — accepting a week plan moves any current active plan to Draft and activates the new one atomically; user sees a hint before confirming
- Empty, loading, and error states standardized across all pages
- Timezone bugs fixed across Dashboard, Training Plan, and AI Coach (local date extraction instead of UTC `toISOString`)
- Root `vitest.config.ts` excluding Playwright e2e tests
- 680 unit and integration tests — all passing

**What Phase 6 delivered:**

- `AthleteContextBuilder` — builds compact `AthleteContext v1` from real DB data (profile, goals, availability, zones, recent activities, current week summary)
- `AthleteContextSnapshot` persistence before every AI request for auditability
- `AnthropicProvider` — Anthropic Claude (`claude-opus-4-8` default) via SDK tool use for structured output
- `MockProvider` — returns realistic fixture JSON when `AI_MOCK=true`; no real API calls needed during development
- `POST /api/ai/generate-week-plan` and `POST /api/ai/generate-workout` — full generation pipeline with validation
- `GET /api/ai/outputs/:id`, `POST /api/ai/outputs/:id/accept`, `POST /api/ai/outputs/:id/reject` — output lifecycle
- Frontend: `AiCoachPage`, `AiWeekPlanPreviewPage`, `AiWorkoutPreviewPage` — request flow, structured preview, accept/reject
- `AiBadge` — visual indicator on AI-generated plans and workouts in Training Plan and Workout Detail pages

**What was already complete (Phases 1–5):**

Training plans, workouts, steps, manual creation UI, activity import (FIT/GPX/TCX/JSON), athlete profile, training zones, import history — all on live backend data.

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

### Garmin sync (optional — Python required)

Garmin sync requires Python 3.10+. Set up the venv once:

```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Then add `GARMIN_EMAIL` and `GARMIN_PASSWORD` to `apps/api/.env`. If your Garmin account has 2FA, run this once interactively to cache the session token:

```bash
python3 scripts/garmin_sync.py --email your@email.com --password yourpassword \
  --interactive --token-store scripts/.garmin_tokens --mode all
```

Subsequent syncs from the UI or API reuse the cached token automatically.

### Strava sync (optional)

Register a Strava developer app at `https://www.strava.com/settings/api`. Set `Authorization Callback Domain` to `localhost`. Add `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` to `apps/api/.env`. Then use the "Connect Strava" button on the Import page to complete the OAuth flow.

## Environment Variables

### `apps/api/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `API_HOST` | no | `127.0.0.1` | Host the API binds to |
| `API_PORT` | no | `3000` | Port the API listens on |
| `WEB_ORIGIN` | no | `http://127.0.0.1:5173` | Allowed CORS origin |
| `GARMIN_EMAIL` | no | — | Garmin Connect account email (for Garmin sync) |
| `GARMIN_PASSWORD` | no | — | Garmin Connect account password |
| `GARMIN_TOKEN_STORE` | no | `scripts/.garmin_tokens` | Directory for cached Garmin session tokens |
| `STRAVA_CLIENT_ID` | no | — | Strava OAuth app client ID |
| `STRAVA_CLIENT_SECRET` | no | — | Strava OAuth app client secret |
| `STRAVA_REDIRECT_URI` | no | `http://127.0.0.1:3000/api/connections/strava/callback` | Strava OAuth redirect URI |

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
| `GET` | `/api/athlete/profile` | Athlete profile with goals, thresholds, availability, and training zones |
| `PATCH` | `/api/athlete/profile` | Partial update of athlete profile fields |
| `GET` | `/api/athlete/context` | Full structured context object (v1) for AI Coach |
| `POST` | `/api/athlete/context/snapshot` | Persist current context snapshot — returns 201 |
| `POST` | `/api/athlete/goals` | Create a training goal |
| `PUT` | `/api/athlete/goals/:id` | Update a training goal |
| `DELETE` | `/api/athlete/goals/:id` | Delete a training goal |
| `PUT` | `/api/athlete/goals/priority` | Reorder goals by priority (body: ordered array of IDs) |

### Activities

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/activities` | Activity list (summary). Query params: `sport`, `dateFrom`, `dateTo` |
| `GET` | `/api/activities/:id` | Full activity detail with laps, zones and metric samples |

### Training

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/training-plans` | All training plans for the athlete |
| `POST` | `/api/training-plans` | Create a training plan |
| `GET` | `/api/training-plans/current-week` | Active training plan with workouts and steps for the current week |
| `GET` | `/api/training-plans/:id` | Training plan by ID with all workouts |
| `PATCH` | `/api/training-plans/:id/activate` | Activate a plan (deactivates current active plan) |
| `DELETE` | `/api/training-plans/:id` | Delete a training plan |
| `GET` | `/api/workouts` | Planned workouts. Query params: `from`, `to` (YYYY-MM-DD), `trainingPlanId` |
| `POST` | `/api/workouts` | Create a planned workout (with optional steps) |
| `GET` | `/api/workouts/:id` | Planned workout by ID with steps |
| `PUT` | `/api/workouts/:id` | Update a planned workout or its status |
| `DELETE` | `/api/workouts/:id` | Delete a planned workout. Returns 409 if linked to an activity; add `?force=true` to force delete |
| `POST` | `/api/workouts/:id/link-activity` | Link an activity to a planned workout — body: `{ activityId }` |
| `DELETE` | `/api/workouts/:id/link-activity` | Unlink the activity from a planned workout |

### Training Zones

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/training-zones` | All training zone sets with their zones |
| `POST` | `/api/training-zones/sets` | Create a new zone set |
| `PUT` | `/api/training-zones/sets/:id` | Update a zone set |
| `DELETE` | `/api/training-zones/sets/:id` | Delete a zone set (cascades its zones) |
| `POST` | `/api/training-zones/sets/:id/zones` | Add a zone to a set |
| `PUT` | `/api/training-zones/zones/:id` | Update a zone |
| `DELETE` | `/api/training-zones/zones/:id` | Delete a zone |

### Analytics

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/analytics/weekly-summary` | Weekly volume by sport. Query: `weeks` (1–26, default 8) |
| `GET` | `/api/analytics/sport-distribution` | Activity count + duration per sport. Query: `from`, `to` (YYYY-MM-DD) |

### Performance

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/performance` | Sport metrics and race predictions |

### AI Coach

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/ai/generate-week-plan` | Generate an AI week training plan |
| `POST` | `/api/ai/generate-workout` | Generate an AI single workout |
| `POST` | `/api/ai/generate-week-analysis` | Generate an AI week analysis for the specified week (body: `{ weekStartDate? }`) |
| `GET` | `/api/ai/outputs/:id` | AI output by ID |
| `GET` | `/api/ai/history` | Recent AI outputs for the athlete |
| `POST` | `/api/ai/outputs/:id/accept` | Accept an AI output — creates plan/workout or marks analysis as accepted |
| `POST` | `/api/ai/outputs/:id/reject` | Reject an AI output |

### Import

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/imports/activity-json` | JSON activity import — full field reference below |
| `POST` | `/api/imports/activity-file` | File upload — `.fit`, `.gpx`, `.tcx` (multipart/form-data, field name `file`) |
| `GET` | `/api/imports` | Import job list. Query params: `status` (`success`\|`failed`\|`duplicate`), `limit` (max 100, default 20), `offset` |
| `GET` | `/api/imports/:id` | Import job detail with file metadata and warning messages |
| `GET` | `/api/imports/history` | Recent import history (last 20) with file metadata and linked activity |

### Sync (Phase 9)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/sync/history` | Sync job history. Query: `source=garmin_unofficial\|strava` |
| `POST` | `/api/sync/garmin` | Trigger Garmin sync. Body: `{ since?, days?, mode?, forceImport?, mfaCode? }` |
| `GET` | `/api/sync/status/garmin` | Garmin configured state + last sync job |
| `POST` | `/api/sync/strava` | Trigger Strava activity sync. Body: `{ forceImport? }` |

### Connections (Phase 9)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/connections/strava` | Strava connection status + athlete name |
| `POST` | `/api/connections/strava/authorize` | Start Strava OAuth — returns `{ authUrl }`. Requires `STRAVA_CLIENT_ID` + `STRAVA_CLIENT_SECRET`. |
| `GET` | `/api/connections/strava/callback` | Strava OAuth callback (browser redirect target) |
| `DELETE` | `/api/connections/strava` | Revoke and delete Strava connection |

### Health data (Phase 9)

Populated by Garmin sync. UI deferred to Phase 10.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health/daily` | Daily health summaries. Query: `from`, `to` (YYYY-MM-DD) |
| `GET` | `/api/health/sleep` | Sleep sessions. Query: `from`, `to` |
| `GET` | `/api/health/hrv` | HRV status history. Query: `from`, `to` |

## API Mode

All pages run on live backend data. `VITE_DATA_MODE=api` must be set in `apps/web/.env`. With no backend running the app shows clear error states rather than silently degrading.

The legacy `mock` mode (`VITE_DATA_MODE=mock`) is no longer supported for core flows — DATA_MODE branches were removed in Phase 8 (P8-003).

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
4. `test:api` — all 618 unit tests pass (no database required)
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
Phase 6   AI Coach MVP                done
Phase 7   MVP Integration             done  ← MVP reached
Phase 8   First Stable Prototype      next
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

### source field

All plans and workouts created through the API in Phase 5 carry `"source": "manual"`. AI Coach-generated content uses `"source": "aiCoach"`.

---

## Phase 6: AI Coach MVP

Phase 6 integrates the AI Coach. The user requests a training week or single workout, the backend builds an athlete context, calls the AI provider, validates the structured output, and returns a preview. The user accepts or rejects — no training entities are created without explicit confirmation.

### AI endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/ai/generate-week-plan` | Generate a structured week plan — returns `AiCoachOutputDto` |
| `POST` | `/api/ai/generate-workout` | Generate a single workout — returns `AiCoachOutputDto` |
| `GET` | `/api/ai/outputs/:id` | Get an AI output by ID |
| `POST` | `/api/ai/outputs/:id/accept` | Accept: creates `TrainingPlan` + `PlannedWorkout` records; week plans auto-activate |
| `POST` | `/api/ai/outputs/:id/reject` | Reject: sets output status to `rejected` |
| `GET` | `/api/ai/history` | Recent AI outputs for the athlete. Query param: `limit` (default 10, max 50) |

### Environment variables (Phase 6 additions)

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes (for live AI) | — | Anthropic Claude API key — backend only, never in frontend |
| `AI_MOCK` | no | `false` | Set to `true` to return fixture data without real API calls |
| `AI_MODEL` | no | `claude-opus-4-8` | Override the Claude model |

### AI Coach flow

```txt
POST /api/ai/generate-week-plan  (or generate-workout)
        ↓
AthleteContextBuilder → compact AthleteContext v1
        ↓
AthleteContextSnapshot persisted
        ↓
AiProviderClient → AnthropicProvider (tool use / structured output)
        ↓
Output validated with Zod schema
        ↓
AiCoachOutput stored (status: draft, validationStatus: valid | invalid)
        ↓
Frontend preview
        ↓
User accepts → TrainingPlan + PlannedWorkout created (source: AiGenerated)
User rejects → status: rejected, no training entities created
```

### Accept response

```json
{
  "trainingPlanId": "plan-uuid",
  "plannedWorkoutIds": ["workout-uuid-1", "workout-uuid-2"]
}
```

For single workout accept:

```json
{
  "plannedWorkoutId": "workout-uuid"
}
```

### Validation rules

AI outputs that fail Zod schema validation are stored with `validationStatus: 'invalid'`. They are returned to the frontend (to allow retry) but cannot be accepted — `POST /api/ai/outputs/:id/accept` returns `422` for invalid outputs. Double-accept or double-reject returns `409`.
