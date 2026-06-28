# scripts/

Python scripts for pp-trainer data sync.

## garmin_sync.py

Fetches Garmin Connect data (activity FIT files + health data) and writes a JSON manifest to stdout. Called by `GarminSyncService.ts` in the API.

### Requirements

- Python 3.10+
- pip packages listed in `requirements.txt`

### Setup

```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Credentials

Set in `apps/api/.env`:

```env
GARMIN_EMAIL=your@email.com
GARMIN_PASSWORD=yourpassword
```

Or stored per-athlete in the `DataSourceConnection` table (takes precedence over env vars).

### Manual test

```bash
# Dry run — wrong credentials returns error manifest, exit 1
python3 scripts/garmin_sync.py \
  --email you@example.com \
  --password yourpassword \
  --days 7 \
  --mode all

# Activities only
python3 scripts/garmin_sync.py --email ... --password ... --days 7 --mode activities

# Health data only, specific start date
python3 scripts/garmin_sync.py --email ... --password ... --since 2026-06-01 --mode health
```

### Output format

```json
{
  "tmpDir": "/tmp/garmin_sync_abc123",
  "activities": [
    {
      "garminId": "1234567890",
      "fitFilePath": "/tmp/garmin_sync_abc123/1234567890.fit",
      "sport": "running",
      "startTime": "2026-06-27 07:30:00",
      "durationSeconds": 3600
    }
  ],
  "healthDays": [
    {
      "date": "2026-06-27",
      "dailySummary": { "restingHeartRate": 52, "steps": 8400, "..." : "..." },
      "sleep": { "totalSleepSeconds": 27000, "..." : "..." },
      "hrv": { "lastNightAvgHrv": 62.0, "status": "balanced" }
    }
  ],
  "error": null
}
```

`tmpDir` and FIT files are **not** deleted by the script — `GarminSyncService` (Node.js) handles cleanup after reading the files.

### Known limitations

- Requires Python 3.10+ on the host machine (`python3` in PATH)
- MFA / two-factor authentication is not supported
- `garminconnect` is an unofficial library — may break if Garmin changes their web API
- Credentials are passed as CLI arguments (visible in process list); use OS-level protections for production
- Health data availability depends on your Garmin device and connected apps
