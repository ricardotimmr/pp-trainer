# ADR-006: MVP Import Format

Status: Accepted

Date: 2026-06-22

## Context

Phase 4 introduces the first working import pipeline. Before building parsers
and normalizers, the entry format must be decided.

Three candidate strategies were evaluated for the MVP:

1. **JSON-first** — a structured, source-agnostic JSON body accepted by a
   dedicated API endpoint
2. **FIT-first** — binary FIT file upload as the primary import path
3. **GPX/TCX-first** — XML-based file upload as the primary import path

Additionally, `docs/05-data-sources-and-import-strategy.md` identifies
`python-garminconnect` as the confirmed primary private sync path. The import
format must be compatible with its JSON output without requiring a custom
transformation layer.

## Decision

Use **JSON as the primary import format** for the pipeline foundation.

File-based import (FIT, GPX, TCX) is the second priority and is built on top
of the same pipeline once the JSON path is stable.

## Rationale

JSON-first provides the following advantages:

- Exercises the full pipeline (validate → parse → normalize → deduplicate →
  store → result) without binary parsing complexity
- Keeps the normalizer and deduplication logic testable without real device
  files
- Is directly compatible with `python-garminconnect` output — the Python worker
  can export activity data to JSON and POST it to the import endpoint without
  additional transformation
- Allows manual test imports from any HTTP client (curl, Postman)
- FIT, GPX and TCX parsers can be added in subsequent issues (P4-007, P4-008)
  once the normalizer is proven

## JSON Import Format Specification

### Endpoint

```
POST /api/imports/activity-json
Content-Type: application/json
```

### Required Fields

| Field | Type | Description |
|---|---|---|
| `athleteProfileId` | `string` | Must match the seeded profile (single-user MVP) |
| `sport` | `string` | One of: `cycling`, `running`, `swimming`, `strength`, `mobility`, `other` |
| `startTime` | `string` | ISO 8601 UTC timestamp, e.g. `"2026-06-20T07:30:00Z"` |
| `durationSeconds` | `number` | Total activity duration in seconds (integer, > 0) |

### Optional Fields

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Activity name |
| `notes` | `string` | Freeform notes |
| `distanceMeters` | `number` | Total distance (integer) |
| `elevationGainMeters` | `number` | Total elevation gain (integer) |
| `averageHeartRate` | `number` | Average HR in bpm (integer) |
| `maxHeartRate` | `number` | Max HR in bpm (integer) |
| `averagePowerWatts` | `number` | Average power (integer, cycling/running) |
| `normalizedPowerWatts` | `number` | Normalized power (integer, cycling) |
| `averageCadence` | `number` | Average cadence (decimal) |
| `averageSpeedKmh` | `number` | Average speed in km/h (decimal) |
| `calories` | `number` | Total calories burned (integer) |
| `perceivedExertion` | `number` | RPE 1–10 scale (integer) |
| `laps` | `array` | Lap records (see Lap Object) |
| `metricSamples` | `array` | Time-series samples (see Metric Sample Object) |
| `timeInZones` | `array` | Zone distribution (see Time in Zone Object) |
| `forceImport` | `boolean` | Skip deduplication check (dev/testing only) |

### Sport-Specific Optional Fields

#### Swimming (`sport: "swimming"`)

| Field | Type | Description |
|---|---|---|
| `poolLengthMeters` | `number` | Pool length (25 or 50) |
| `dominantStrokeType` | `string` | One of: `freestyle`, `backstroke`, `breaststroke`, `butterfly`, `mixed`, `drill` |
| `totalStrokeCount` | `number` | Total strokes |
| `swimLaps` | `array` | Swim lap records (see Swim Lap Object) |

#### Strength (`sport: "strength"`)

| Field | Type | Description |
|---|---|---|
| `totalSets` | `number` | Total sets performed |
| `totalReps` | `number` | Total repetitions |
| `strengthSets` | `array` | Individual set records (see Strength Set Object) |

---

### Lap Object

```json
{
  "lapNumber": 1,
  "durationSeconds": 600,
  "distanceMeters": 2000,
  "averageHeartRateBpm": 145,
  "maxHeartRateBpm": 158,
  "averagePaceSecPerKm": 300,
  "averagePowerWatts": 210,
  "averageCadence": 88.5,
  "elevationGainMeters": 12
}
```

Required: `lapNumber`, `durationSeconds`, `distanceMeters`
All other fields optional.

### Swim Lap Object

```json
{
  "lapNumber": 1,
  "durationSeconds": 52,
  "distanceMeters": 50,
  "strokeType": "freestyle",
  "strokeCount": 36,
  "swolfScore": 88,
  "averagePaceSecPer100m": 104
}
```

Required: `lapNumber`, `durationSeconds`, `distanceMeters`

### Strength Set Object

```json
{
  "setNumber": 1,
  "exerciseName": "Squat",
  "exerciseCategory": "legs",
  "reps": 8,
  "weightKg": 80.0,
  "durationSeconds": 45
}
```

Required: `setNumber`

### Metric Sample Object

```json
{
  "offsetSeconds": 60,
  "heartRateBpm": 142,
  "powerWatts": 215,
  "cadenceRpm": 89.0,
  "speedKmh": 35.2,
  "elevationMeters": 412.5,
  "latitude": 52.520008,
  "longitude": 13.404954
}
```

Required: `offsetSeconds`
At least one metric field should be present.

### Time in Zone Object

```json
{
  "zoneNumber": 3,
  "zoneName": "Tempo",
  "durationSeconds": 1800,
  "percentage": 28.5
}
```

Required: `zoneNumber`, `zoneName`, `durationSeconds`, `percentage`

---

### Minimal Working Example

```json
{
  "athleteProfileId": "clx1234567890",
  "sport": "running",
  "startTime": "2026-06-20T07:30:00Z",
  "durationSeconds": 3600,
  "distanceMeters": 12000,
  "averageHeartRate": 148
}
```

### Full Running Example

```json
{
  "athleteProfileId": "clx1234567890",
  "sport": "running",
  "title": "Morning tempo run",
  "startTime": "2026-06-20T07:30:00Z",
  "durationSeconds": 3600,
  "distanceMeters": 12000,
  "elevationGainMeters": 95,
  "averageHeartRate": 148,
  "maxHeartRate": 168,
  "averageCadence": 176,
  "calories": 680,
  "laps": [
    {
      "lapNumber": 1,
      "durationSeconds": 300,
      "distanceMeters": 1000,
      "averageHeartRateBpm": 142,
      "averagePaceSecPerKm": 300
    },
    {
      "lapNumber": 2,
      "durationSeconds": 298,
      "distanceMeters": 1000,
      "averageHeartRateBpm": 151,
      "averagePaceSecPerKm": 298
    }
  ],
  "timeInZones": [
    { "zoneNumber": 2, "zoneName": "Easy", "durationSeconds": 600, "percentage": 16.7 },
    { "zoneNumber": 3, "zoneName": "Tempo", "durationSeconds": 2700, "percentage": 75.0 },
    { "zoneNumber": 4, "zoneName": "Threshold", "durationSeconds": 300, "percentage": 8.3 }
  ]
}
```

---

## Import Pipeline Stages

All import sources go through the same pipeline regardless of format:

```
Input (JSON body or uploaded file)
        ↓
1. Validate      — schema/type/size check; fail fast with 400 on invalid input
        ↓
2. Parse         — source-specific parser → ParsedActivity intermediate
        ↓
3. Store raw     — ImportedFile + RawActivityData written before normalization
        ↓
4. Normalize     — ParsedActivity → Prisma Activity write shape (sport-specific)
        ↓
5. Deduplicate   — hash match + startTime/sport/duration similarity check
        ↓
6. Store         — Activity + relations (laps, swimLaps, metricSamples, etc.)
        ↓
7. Update job    — ImportJob.status, ImportJob.activityId, ImportJob.errorMessage
        ↓
8. Return result — ImportResultDto { importId, status, activityId, errors }
```

Stage 3 (store raw) runs before stage 4 so that raw data survives a parse or
normalization failure and can be reprocessed later.

---

## python-garminconnect Bridge Pattern

The JSON format above is designed to accept output from a `python-garminconnect`
Python worker directly, with no transformation required on the Python side.

The worker would:
1. Fetch activity data via `python-garminconnect`
2. Map Garmin fields to the JSON format above
3. POST the payload to `POST /api/imports/activity-json`

This bridge is not implemented in Phase 4. It is noted here so the JSON format
remains stable when the bridge is built.

---

## Consequences

- The JSON import endpoint is the stable entry point for all programmatic imports
- FIT/GPX/TCX file parsers produce a `ParsedActivity` intermediate and feed into
  the same normalizer as the JSON parser — no separate normalization path
- The `ImportJob` model tracks pipeline execution for all import sources
- `forceImport: true` is a dev-only bypass that must not be exposed in the UI

## Alternatives Considered

### FIT-first

FIT is the richest format but requires binary parsing setup before the pipeline
can be tested at all. This adds risk to the first pipeline iteration.

### GPX/TCX-first

XML files are easier to parse than FIT but still require file upload
infrastructure and XML tooling before the pipeline produces any results.
