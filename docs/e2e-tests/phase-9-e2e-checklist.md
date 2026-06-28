# Phase 9 E2E Checklist

## Garmin Sync

### Setup
- [ ] `GARMIN_EMAIL` and `GARMIN_PASSWORD` set in `apps/api/.env`
- [ ] Python venv created: `cd scripts && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- [ ] First-auth token cache populated (run `python3 scripts/garmin_sync.py --email ... --password ... --interactive --token-store scripts/.garmin_tokens` in terminal if 2FA account)

### Import page — Garmin card
- [ ] Import page loads without error
- [ ] Garmin card shows "Configured" status when credentials are set
- [ ] Garmin card shows "Not configured" when `GARMIN_EMAIL` is absent
- [ ] "Sync now" button triggers sync (loading state visible)
- [ ] Success toast shows correct activity count after sync
- [ ] Sync history section shows last 5 runs with status and counts
- [ ] Error toast shown on sync failure (e.g. wrong credentials)

### API level
- [ ] `GET /api/sync/status/garmin` → `{ configured: true, lastSync: ... }`
- [ ] `POST /api/sync/garmin` with `{ days: 7 }` → imports recent activities
- [ ] Second `POST /api/sync/garmin` → all activities skipped (externalId dedup)
- [ ] `GET /api/sync/history?source=garmin_unofficial` → shows sync jobs with counts
- [ ] `POST /api/sync/garmin` when `GARMIN_EMAIL` not set → 500 with message about missing credentials
- [ ] Activities appear in activity list after successful sync
- [ ] Activity detail page shows Garmin-sourced activity data

---

## Strava OAuth + Sync

### Connect flow
- [ ] `GET /api/connections/strava` → `{ configured: true, connected: false }` initially
- [ ] `POST /api/connections/strava/authorize` → returns `{ authUrl }` containing `strava.com/oauth/authorize`
- [ ] Clicking "Connect Strava" on Import page opens Strava OAuth in browser
- [ ] Authorizing on Strava redirects back to `http://127.0.0.1:3000/api/connections/strava/callback?code=...`
- [ ] Callback redirects to `/import?strava=connected`
- [ ] Import page detects `?strava=connected` → toast.success("Strava connected")
- [ ] `GET /api/connections/strava` → `{ connected: true, athleteName: "...", ... }`
- [ ] Strava card on Import page shows athlete name and "Sync now" button

### Sync flow
- [ ] "Sync now" triggers `POST /api/sync/strava`
- [ ] Activities from last 30 days imported (first sync)
- [ ] Success toast shows activity count
- [ ] Second sync → activities skipped (externalId dedup)
- [ ] `GET /api/sync/history?source=strava` → shows sync job with counts
- [ ] Strava activities appear in activity list with correct sport

### Disconnect flow
- [ ] "Disconnect" button on Strava card shows confirmation
- [ ] Confirming disconnect → `DELETE /api/connections/strava` → 204
- [ ] `GET /api/connections/strava` → `{ connected: false }` after disconnect
- [ ] Import page shows "Connect Strava" button again

### Error states
- [ ] `POST /api/connections/strava/authorize` when credentials not configured → 503
- [ ] `POST /api/sync/strava` without active connection → 401
- [ ] User denies Strava OAuth → redirect to `/import?strava=denied` → toast.error

---

## Cross-source deduplication

- [ ] Upload a FIT file manually → activity appears in list
- [ ] Trigger Garmin sync with same activity → second import skipped (duplicate)
- [ ] Garmin sync imports an activity → same workout exists on Strava → Strava sync marks it duplicate (similarity check)
- [ ] `forceImport: true` in `POST /api/sync/garmin` → re-imports despite duplicates

---

## Phase 8 Regression

- [ ] Manual FIT upload still works
- [ ] Manual GPX upload still works
- [ ] Manual TCX upload still works
- [ ] Manual JSON import still works
- [ ] Import history section still shows manual uploads
- [ ] Activity list, detail, dashboard, training plan all load without error
- [ ] AI coach flows (week plan, workout, week analysis) unaffected
- [ ] All 96 test files / 1789 tests pass

---

## TypeScript
- [ ] `npx tsc -p apps/api/tsconfig.json --noEmit` → 0 errors
- [ ] `npx tsc -p apps/web/tsconfig.app.json --noEmit` → 0 errors
- [ ] `npx tsc -p packages/shared/tsconfig.json --noEmit` → 0 errors

## Python
- [ ] `python3 -m py_compile scripts/garmin_sync.py` → no errors
- [ ] `python3 -c "from garminconnect import Garmin; print('ok')"` → ok (venv active)
