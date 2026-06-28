# Phase 9 Followups

These items were intentionally deferred during Phase 9 implementation.

## P9-002a Health data dashboard UI (deferred to Phase 10)

The backend is fully ready: `GET /api/health/daily`, `GET /api/health/sleep`, `GET /api/health/hrv` all exist and are populated by Garmin sync. The data model (`DailyHealthSummary`, `SleepSession`, `HrvStatus`) is stable.

What is missing is the frontend UI. When revisiting:

- Three health cards on the Dashboard or a dedicated Health page: Daily Summary, Sleep, HRV Status
- `useDailyHealth`, `useSleepSessions`, `useHrvStatus` hooks → the three GET endpoints
- `HealthSummaryCard`, `SleepCard`, `HrvCard` components
- Range toggle per card: 7d / 14d / 30d
- Empty state when no Garmin health data has been synced yet
- Body battery, resting HR, and sleep score are the most visually useful fields

Note: SpO2 (`avgSpo2`) is stored but Garmin does not populate it for devices without the sensor. Handle null gracefully.

## Garmin MFA / session token workaround

The current setup requires an interactive first-run in the terminal to complete email-based 2FA. Subsequent runs use the cached token in `scripts/.garmin_tokens`. This is sufficient for a personal single-machine setup.

If this needs to work across machines or in a deployment:

- Pre-seed the token store from a one-time interactive auth
- Consider a dedicated setup flow on the Import page: "Authenticate Garmin (first time)" that POSTs to a helper endpoint that runs the Python script in interactive mode and streams back the MFA prompt
- The token cache directory (`scripts/.garmin_tokens`) should be backed up if moving machines

## Garmin incremental sync

Currently each sync fetches the full window specified by `since`/`days` in the request body. Dedup prevents re-importing but means every Garmin sync re-downloads and re-processes all FIT files in the window.

For true incremental sync (only new activities since last sync):

- Store `lastSyncedItemAt` in `DataSourceConnection` after Garmin sync (mirror the Strava pattern)
- Pass it as `--since` to `garmin_sync.py` on subsequent calls
- The `GET /api/sync/status/garmin` response could include `lastSyncedItemAt` so the UI can show "Last activity: [date]"

## Strava first-sync full history

The first Strava sync defaults to 30 days. If the user wants to import their full Strava history:

- Add `since?: string` and `days?: number` params to `POST /api/sync/strava`
- Pass them as `after = Math.floor(new Date(since).getTime() / 1000)` or `now - days * 86400`
- The UI could offer a "Import full history" option with a warning about time and duplicates
- Strava rate limits: 100 requests / 15 minutes, 1000 / day. A large history import should page slowly or batch with delays.

## Strava `sport_type` → full parity

Strava deprecated `type` in 2024. The mapper now correctly prefers `sport_type`, but some newer Strava activity types only exist in `sport_type` and have no `type` equivalent (e.g. `GravelRide`, `MountainBikeRide` vs old `Ride`). The `SPORT_MAP` should be extended with all new `sport_type` values as Strava adds them.

Current gap: `EBikeRide`, `Handcycle`, `Kayaking`, `Kitesurf`, `NordicSki`, `Rowing`, `Snowboard`, `Surfing`, `Velomobile`, `VirtualRun` are all mapped to `'other'`. This is correct behavior but worth reviewing as the Strava sport type list expands.

## Webhook-based Strava sync

The current Strava sync is polling: user must click "Sync now". Strava supports push webhooks:

- Strava sends a POST to your endpoint when a new activity is created
- Requires a publicly accessible HTTPS endpoint (not possible in pure local dev)
- Would enable near-real-time sync after workout completion
- `POST /api/connections/strava/webhook` would receive the push and trigger `StravaSyncService.sync()`

Defer until the app has a public deployment.

## Automatic periodic sync (cron / background worker)

Both Garmin and Strava require manual triggers. Options for automation:

- **Node.js `node-cron`**: schedule `GarminSyncService.sync` and `StravaSyncService.sync` on a timer (e.g. every 6h)
- **OS-level cron**: `crontab -e` → `0 */6 * * * curl -X POST http://127.0.0.1:3000/api/sync/garmin`
- **System tray or menu bar app**: trigger sync on demand with a native notification

Simplest option for local dev: add an optional `SYNC_INTERVAL_HOURS` env var and schedule via `setInterval` at server startup.

## Multi-user support

All data is scoped to `findFirstAthleteProfile()`. Before multi-user:

- Replace all `findFirstAthleteProfile()` calls with an authenticated user context (JWT or session)
- `DataSourceConnection` is already per-athlete (`athleteProfileId`), so the data model is multi-user ready
- `GarminSyncService.sync()` uses env var credentials globally — per-user credentials would need to come exclusively from `DataSourceConnection`
- Strava OAuth is already per-athlete since `exchangeCode` stores per `athleteProfileId`

## Garmin CLI credential exposure

`--email` and `--password` are passed as command-line arguments to `garmin_sync.py`. On shared Unix systems these are visible in `ps aux`. For a single-user local machine this is acceptable.

If deployed on a shared server:
- Use environment variables inside the subprocess instead of args: `os.environ['GARMIN_EMAIL']`
- Or write credentials to a tempfile with restricted permissions and pass the path

## Official Garmin Health API

Garmin has an official Wellness API for health data (HRV, sleep, body battery). It requires applying for API access — typically granted to companies, not individuals. If access is ever obtained:

- Replace the python-garminconnect health fetch with official API calls
- The `DailyHealthSummary`, `SleepSession`, `HrvStatus` models are already designed for this
- `GarminSyncService` would have an official code path alongside the unofficial one

## Aggregator API as fallback

Services like Runalyze, Intervals.icu, or Enduco aggregate Garmin + Strava + other sources. If the unofficial Garmin library breaks:

- Evaluate whether an aggregator API provides similar data with official access
- Check costs and data ownership terms
- The adapter pattern in Phase 9 means adding a new source is a contained change

## Strava rate limits

Strava's rate limits: 100 requests / 15 minutes, 1000 / day. For large accounts:

- The current paginator stops when a page returns fewer than 100 items
- A 1000-activity history would require 10 API calls — within limits
- If the user has 10,000+ activities and wants a full-history import, add exponential backoff and a rate limit delay between pages
- Log how many API calls were used in the sync manifest

## `garminconnect` version pinning

`scripts/requirements.txt` currently specifies `garminconnect>=0.2.20`. This is a lower bound that could allow a future breaking version. Pin to a tested range:
```
garminconnect>=0.3.6,<0.4.0
```
Update and test after each minor version bump.
