# Zone Calculation — Implementation Plan

Issue: P8-004  
Depends on: P8-002

---

## Context

`docs/zones/zones.ts` contains the complete calculation logic — Karvonen, Coggan, Friel, CSS. No changes needed there. This plan is only about wiring that logic into the full stack.

Zones are **read-only and derived**. The user never edits zone bounds directly; they set their profile values and zones recalculate automatically.

---

## Approach: API-side calculation, stored in DB

Zones are calculated on the API after every profile save and written to the existing `TrainingZoneSet` / `TrainingZone` tables. The frontend reads them through the existing `GET /api/athlete/settings` endpoint — no new read endpoint needed.

**Why not calculate in the frontend?**  
The AI coach reads `trainingZones` from the athlete context snapshot (built server-side). If zones only exist in the browser, the AI can't use them. Storing in DB keeps the whole system in sync.

---

## Data Mapping

`zones.ts` → Prisma schema

| zones.ts field | AthleteProfile field (DB / DTO) |
|---|---|
| `maxHR` | `maxHeartRateBpm` |
| `restingHR` | `restingHeartRateBpm` |
| `bikeFTP` | `currentFtpWatts` |
| `bikeLTHR` | *(not stored yet — optional, can be added later)* |
| `runLTHR` | `runningThresholdHrBpm` |
| `runThresholdPace` | `runningThresholdPaceSecPerKm` |
| `swimThresholdPace` | `swimmingThresholdPaceSecPer100m` |

Zone type → `TrainingZoneType` enum mapping:

| zones.ts key | Prisma `TrainingZoneType` | `sport` field |
|---|---|---|
| `cyclingHR` | `HeartRate` | `Cycling` |
| `cyclingPower` | `CyclingPower` | `Cycling` |
| `runningHR` | `HeartRate` | `Running` |
| `runningPace` | `RunningPace` | `Running` |
| `swimmingPace` | `SwimmingPace` | `Swimming` |

Zone bounds → `TrainingZone` fields:

- `HRZone.low / high` → `lowerBound / upperBound` (bpm)
- `PowerZone.low / high` → `lowerBound / upperBound` (watts); `null` high → `null upperBound`
- `PaceZone.fast / slow` → `lowerBound / upperBound` (sec/km or sec/100m)  
  *(fast = lower bound, slow = upper bound — consistent with how ZoneList already displays pace)*

---

## Files to Change

### `packages/shared/src/schemas/athlete.ts`
No changes needed — zone DTOs already exist (`TrainingZoneSetDto`, `TrainingZoneDto`).

---

### `apps/api/src/services/ZoneCalculationService.ts` — NEW

Port `docs/zones/zones.ts` logic to TypeScript (essentially the same file, adapted for Prisma types):

```ts
// Input: AthleteProfile from Prisma
// Output: array of zone set upsert payloads

export type ZoneSetPayload = {
  zoneType: TrainingZoneType;
  sport: SportType | null;
  name: string;
  basedOn: string;
  zones: { zoneNumber: number; name: string; lowerBound: number | null; upperBound: number | null; unit: TrainingZoneUnit }[];
};

export function buildZonePayloads(profile: AthleteProfile): ZoneSetPayload[]
```

Only include a zone set payload when its required fields are non-null. Guards:

- `cyclingHR` → requires `maxHeartRateBpm`, `restingHeartRateBpm`
- `cyclingPower` → requires `currentFtpWatts`
- `runningHR` → requires `runningThresholdHrBpm`, `maxHeartRateBpm`
- `runningPace` → requires `runningThresholdPaceSecPerKm`
- `swimmingPace` → requires `swimmingThresholdPaceSecPer100m`

---

### `apps/api/src/repositories/AthleteRepository.ts`

Add:

```ts
export async function replaceZoneSets(
  athleteProfileId: string,
  payloads: ZoneSetPayload[],
): Promise<void>
```

Implementation: wrap in a `prisma.$transaction`:
1. Delete all existing `TrainingZoneSet` rows for this `athleteProfileId`
2. For each payload: `create` a `TrainingZoneSet` with nested `zones`

Delete-and-recreate is simpler and correct for auto-calculated zones — there's no user-authored data to preserve.

---

### `apps/api/src/services/AthleteService.ts`

In `patchAthleteProfile`, after the profile update succeeds:

```ts
const payloads = buildZonePayloads(updatedProfile);
await AthleteRepository.replaceZoneSets(profile.id, payloads);
```

Also add a standalone function for the seed/backfill case:

```ts
export async function recalculateZones(athleteProfileId: string): Promise<void>
```

---

### `apps/api/src/routes/athleteRoutes.ts`

Add one endpoint for manual recalculation (useful for seeding and debugging):

```
POST /api/athlete/zones/recalculate
→ 204 No Content
```

Calls `AthleteService.recalculateZones(profileId)`. No request body needed.

---

### `apps/web/src/pages/SettingsPage.tsx` — `ZonesSection`

Currently reads `trainingZoneSets` and renders them unconditionally. Changes needed:

1. Also receive `profile: AthleteProfileDto` as prop (to know which fields are set)
2. Per zone set: if the required profile fields are missing, replace the zone card with a `<MissingFieldsPrompt>` inline component instead
3. The prompt text says which profile fields to fill in and links to the edit action (e.g. "Set Bike FTP in your profile")

**Missing fields prompt per zone type:**

| Zone type | Prompt |
|---|---|
| Cycling HR | "Set Max HR and Resting HR in your profile" |
| Cycling Power | "Set Bike FTP in your profile" |
| Running HR | "Set Max HR and Run HR threshold in your profile" |
| Running Pace | "Set Run threshold pace in your profile" |
| Swimming Pace | "Set Swim threshold pace in your profile" |

If a zone type has no data AND fields are not missing (i.e. fields are set but zones haven't been calculated yet), show a "Recalculate" button that calls `POST /api/athlete/zones/recalculate` → `refresh()`.

---

### `apps/web/src/mock/prototypeData.ts` (DATA_MODE=mock)

The mock profile already has all threshold values. `ZonesSection` in mock mode can either:
- Call `calculateZones()` from `zones.ts` directly in the frontend (one-off import, only for mock)
- Or reuse the same component path and rely on `prototypeTrainingZoneSets` already having correct seed data

Simplest: keep mock zones as static seed data, update the seed values to match the current mock profile.

---

## Trigger Points for Recalculation

| When | How |
|---|---|
| `PATCH /api/athlete/profile` succeeds | Automatic, inside `patchAthleteProfile` service |
| Manual trigger (dev/seed) | `POST /api/athlete/zones/recalculate` |
| DB seed / restore script | Call `recalculateZones()` after seeding athlete profile |

---

## Verification Checklist

1. `npx tsc -p apps/api/tsconfig.json --noEmit` — zero errors
2. `npx tsc -p apps/web/tsconfig.app.json --noEmit` — zero errors
3. Open Settings page: all 5 zone types visible with current mock profile values
4. Remove `runningThresholdPaceSecPerKm` from profile → Running Pace zone card replaced with prompt
5. Re-add value and save → Running Pace zones reappear immediately (no reload)
6. Zone bounds match expected values from `zones.ts` smoke test (e.g. Cycling Z4 Threshold ≈ 258–285 W at FTP 285)
7. AI Coach context snapshot contains `trainingZones` after profile save
