#!/usr/bin/env python3
"""
Garmin Connect sync script for pp-trainer.

Fetches activity FIT files and health data (daily summary, sleep, HRV)
from Garmin Connect and writes a single JSON manifest to stdout.

All log output goes to stderr so stdout stays clean for the manifest.
Node.js (GarminSyncService) reads the manifest and is responsible for
cleaning up tmpDir and the FIT files within it.

Exit codes:
  0 — manifest written (check manifest.error for soft failures)
  1 — fatal error before manifest could be written
"""

import argparse
import io
import json
import os
import sys
import tempfile
import zipfile
from datetime import date, datetime, timedelta, timezone


# ── Logging ─────────────────────────────────────────────────────────────────

def log(msg: str) -> None:
    print(f"[garmin_sync] {msg}", file=sys.stderr, flush=True)


# ── Args ────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Garmin Connect sync for pp-trainer")
    p.add_argument("--email",       required=True,  help="Garmin account email")
    p.add_argument("--password",    required=True,  help="Garmin account password")
    p.add_argument("--mfa-code",    default=None,   help="OTP code for MFA (use when you already have the code)")
    p.add_argument("--token-store", default=None,   help="Directory to cache Garmin OAuth tokens (enables MFA-free subsequent runs)")
    p.add_argument("--interactive", action="store_true", help="Read MFA code from stdin (for first-time terminal setup)")
    p.add_argument("--since",       default=None,   help="Start date YYYY-MM-DD (overrides --days)")
    p.add_argument("--days",        type=int, default=30, help="Days back from today (default 30)")
    p.add_argument("--mode",        choices=["activities", "health", "all"], default="all")
    return p.parse_args()


def resolve_date_range(since_str: str | None, days: int) -> tuple[date, date]:
    end = date.today()
    if since_str:
        try:
            start = date.fromisoformat(since_str)
        except ValueError:
            log(f"invalid --since '{since_str}', falling back to --days={days}")
            start = end - timedelta(days=days)
    else:
        start = end - timedelta(days=days)
    return start, end


# ── Helpers ─────────────────────────────────────────────────────────────────

def safe_call(fn, *args, label: str = "", **kwargs):
    """Call fn(*args, **kwargs) and return None on any exception."""
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        log(f"warning: {label} — {exc}")
        return None


def extract_fit_from_download(raw: bytes, activity_id: str) -> bytes | None:
    """
    Garmin's ORIGINAL download is sometimes a raw FIT, sometimes a ZIP
    containing the FIT. Detect and extract accordingly.
    """
    if not raw:
        return None
    # ZIP magic bytes: PK\x03\x04
    if raw[:4] == b"PK\x03\x04":
        try:
            with zipfile.ZipFile(io.BytesIO(raw)) as zf:
                fit_names = [n for n in zf.namelist() if n.lower().endswith(".fit")]
                if not fit_names:
                    log(f"warning: no .fit file inside ZIP for activity {activity_id}")
                    return None
                return zf.read(fit_names[0])
        except zipfile.BadZipFile as exc:
            log(f"warning: bad ZIP for activity {activity_id}: {exc}")
            return None
    # Assume raw FIT (magic: 0x0E 0x10 or similar — don't validate, just pass through)
    return raw


def ms_or_str_to_iso(value) -> str | None:
    """
    Convert a Garmin timestamp to an ISO 8601 string.
    Garmin sometimes returns milliseconds since epoch (int),
    sometimes an ISO string, sometimes None.
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc).isoformat()
    if isinstance(value, str) and value:
        return value
    return None


def extract_body_battery_bounds(bb_data) -> tuple[int | None, int | None]:
    """
    Extract (low, high) body battery from the API response.
    The library returns a list of day-objects, each with a bodyBatteryValuesArray
    containing [timestamp, level] pairs (confirmed against live Garmin API).
    """
    if not bb_data:
        return None, None

    levels: list[int] = []

    entries = bb_data if isinstance(bb_data, list) else [bb_data]
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        # Primary: [timestamp, level] pairs
        for pair in entry.get("bodyBatteryValuesArray") or []:
            if isinstance(pair, (list, tuple)) and len(pair) >= 2:
                lvl = pair[1]
                if isinstance(lvl, (int, float)):
                    levels.append(int(lvl))

    if not levels:
        return None, None
    return min(levels), max(levels)


def safe_int(value) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def safe_float(value) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


# ── Activities ───────────────────────────────────────────────────────────────

def fetch_activities(client, start: date, end: date, tmp_dir: str) -> list[dict]:
    """
    Fetch activities in the date range [start, end] and download FIT files.
    Activities come back newest-first from Garmin, so we stop as soon as
    we hit one older than `start`.
    """
    activities: list[dict] = []
    start_idx = 0
    batch_size = 100

    while True:
        batch = safe_call(
            client.get_activities, start_idx, batch_size,
            label=f"get_activities(offset={start_idx})",
        )
        if not batch:
            break

        stop_after_batch = False
        for act in batch:
            # Parse date from startTimeGMT: "YYYY-MM-DD HH:MM:SS"
            gmt_str = act.get("startTimeGMT", "")
            try:
                act_date = date.fromisoformat(gmt_str[:10])
            except ValueError:
                log(f"warning: could not parse date '{gmt_str}', skipping activity")
                continue

            if act_date > end:
                continue  # future or too recent, keep going

            if act_date < start:
                # Older than our window — activities are sorted newest-first,
                # so everything from here on is also too old
                stop_after_batch = True
                break

            garmin_id = str(act.get("activityId", "")).strip()
            if not garmin_id:
                continue

            log(f"downloading FIT for activity {garmin_id} ({gmt_str[:10]})")
            raw = safe_call(
                client.download_activity,
                garmin_id,
                dl_fmt=client.ActivityDownloadFormat.ORIGINAL,
                label=f"download_activity({garmin_id})",
            )
            if not raw:
                log(f"warning: empty download for activity {garmin_id}, skipping")
                continue

            fit_bytes = extract_fit_from_download(raw, garmin_id)
            if fit_bytes is None:
                log(f"warning: could not extract FIT for activity {garmin_id}, skipping")
                continue

            fit_path = os.path.join(tmp_dir, f"{garmin_id}.fit")
            with open(fit_path, "wb") as f:
                f.write(fit_bytes)
            log(f"wrote {len(fit_bytes)} bytes → {fit_path}")

            activities.append({
                "garminId": garmin_id,
                "fitFilePath": fit_path,
                "sport": act.get("activityType", {}).get("typeKey", "other"),
                "startTime": gmt_str,
                "durationSeconds": safe_int(act.get("duration")) or 0,
            })

        if stop_after_batch or len(batch) < batch_size:
            break
        start_idx += batch_size

    return activities


# ── Health data (per day) ────────────────────────────────────────────────────

def fetch_daily_summary(client, date_str: str) -> dict | None:
    stats = safe_call(client.get_stats, date_str, label=f"get_stats({date_str})")
    bb    = safe_call(client.get_body_battery, date_str, label=f"get_body_battery({date_str})")
    spo2  = safe_call(client.get_spo2_data, date_str, label=f"get_spo2_data({date_str})")
    resp  = safe_call(client.get_respiration_data, date_str, label=f"get_respiration_data({date_str})")

    # If all four calls returned nothing, skip the day entirely
    if stats is None and bb is None and spo2 is None and resp is None:
        return None

    bb_low, bb_high = extract_body_battery_bounds(bb)

    return {
        "restingHeartRate": safe_int((stats or {}).get("restingHeartRate")),
        "steps":            safe_int((stats or {}).get("totalSteps")),
        "floors":           safe_int((stats or {}).get("floorsAscended")),
        "activeCalories":   safe_int((stats or {}).get("activeKilocalories")),
        "totalCalories":    safe_int((stats or {}).get("totalKilocalories")),
        "avgStressLevel":   safe_int((stats or {}).get("averageStressLevel")),
        "bodyBatteryLow":   bb_low,
        "bodyBatteryHigh":  bb_high,
        "avgRespiration":   safe_float((resp or {}).get("avgWakingRespirationValue")),
        "avgSpo2":          safe_float((spo2 or {}).get("averageSpO2")),
    }


def fetch_sleep(client, date_str: str) -> dict | None:
    raw = safe_call(client.get_sleep_data, date_str, label=f"get_sleep_data({date_str})")
    if not raw:
        return None

    dto = raw.get("dailySleepDTO") or {}
    if not dto:
        return None

    scores  = dto.get("sleepScores") or {}
    overall = scores.get("overall") or {}

    return {
        "startTime":         ms_or_str_to_iso(dto.get("sleepStartTimestampGMT")),
        "endTime":           ms_or_str_to_iso(dto.get("sleepEndTimestampGMT")),
        "totalSleepSeconds": safe_int(dto.get("sleepTimeSeconds")),
        "deepSleepSeconds":  safe_int(dto.get("deepSleepSeconds")),
        "lightSleepSeconds": safe_int(dto.get("lightSleepSeconds")),
        "remSleepSeconds":   safe_int(dto.get("remSleepSeconds")),
        "awakeSeconds":      safe_int(dto.get("awakeSleepSeconds")),
        "sleepScore":        safe_int(overall.get("value")),
        "avgStress":         safe_float(dto.get("avgSleepStress")),
        "avgSpo2":           safe_float(dto.get("averageSpO2Value")),
    }


def fetch_hrv(client, date_str: str) -> dict | None:
    raw = safe_call(client.get_hrv_data, date_str, label=f"get_hrv_data({date_str})")
    if not raw:
        return None

    summary = raw.get("hrvSummary") or {}
    if not summary:
        return None

    status_raw = summary.get("status")
    # Garmin returns e.g. 'BALANCED', 'UNBALANCED', 'POOR', 'LOW', 'NONE'
    status = status_raw.lower() if isinstance(status_raw, str) and status_raw else None

    return {
        "weeklyAvgHrv":          safe_float(summary.get("weeklyAvg")),
        "lastNightAvgHrv":       safe_float(summary.get("lastNight")),
        "lastNightFiveMinHigh":  safe_float(summary.get("lastNight5MinHigh")),
        "status":                status,
    }


def fetch_health_days(client, start: date, end: date) -> list[dict]:
    health_days: list[dict] = []
    current = start
    while current <= end:
        date_str = current.isoformat()
        log(f"health data: {date_str}")
        health_days.append({
            "date":         date_str,
            "dailySummary": fetch_daily_summary(client, date_str),
            "sleep":        fetch_sleep(client, date_str),
            "hrv":          fetch_hrv(client, date_str),
        })
        current += timedelta(days=1)
    return health_days


# ── Main ─────────────────────────────────────────────────────────────────────

def emit_fatal(tmp_dir: str, error: str) -> None:
    """Write an error manifest and exit 1."""
    print(json.dumps({"tmpDir": tmp_dir, "activities": [], "healthDays": [], "error": error}))
    sys.exit(1)


def main() -> None:
    args = parse_args()
    start, end = resolve_date_range(args.since, args.days)
    log(f"range: {start} → {end}  mode: {args.mode}")

    tmp_dir = tempfile.mkdtemp(prefix="garmin_sync_")
    log(f"tmpDir: {tmp_dir}")

    # Import garminconnect — fail fast with a clear message if missing
    try:
        from garminconnect import Garmin, GarminConnectAuthenticationError
    except ImportError:
        emit_fatal(
            tmp_dir,
            "garminconnect not installed — run: pip install -r scripts/requirements.txt",
        )

    # Token store — enables MFA-free subsequent runs
    token_store = args.token_store
    if token_store:
        import pathlib
        pathlib.Path(token_store).mkdir(parents=True, exist_ok=True)
        log(f"token store: {token_store}")

    # MFA callback — used on first auth when 2FA is enabled
    mfa_code = args.mfa_code

    def interactive_mfa() -> str:
        print("[garmin_sync] Garmin sent a verification code to your email.", file=sys.stderr, flush=True)
        print("[garmin_sync] Enter code: ", end="", file=sys.stderr, flush=True)
        return input()

    if mfa_code:
        prompt_mfa = lambda: mfa_code
    elif args.interactive:
        prompt_mfa = interactive_mfa
    else:
        prompt_mfa = None

    # Login
    try:
        client = Garmin(email=args.email, password=args.password, prompt_mfa=prompt_mfa)
        client.login(tokenstore=token_store)
        log("login OK")
    except GarminConnectAuthenticationError as exc:
        msg = str(exc)
        if "MFA" in msg and not mfa_code and not args.interactive:
            emit_fatal(
                tmp_dir,
                "MFA_REQUIRED: your Garmin account has 2FA enabled. "
                "Run the first-time setup from your terminal: "
                "scripts/.venv/bin/python3 scripts/garmin_sync.py --email <email> --password <pw> "
                "--token-store scripts/.garmin_tokens --interactive --days 1 --mode health",
            )
        emit_fatal(tmp_dir, f"Authentication failed: {exc}")
    except Exception as exc:
        emit_fatal(tmp_dir, f"Login error: {exc}")

    activities: list[dict] = []
    health_days: list[dict] = []

    if args.mode in ("activities", "all"):
        log("fetching activities…")
        activities = fetch_activities(client, start, end, tmp_dir)
        log(f"activities: {len(activities)} found")

    if args.mode in ("health", "all"):
        log("fetching health data…")
        health_days = fetch_health_days(client, start, end)
        log(f"health days: {len(health_days)}")

    manifest = {
        "tmpDir":      tmp_dir,
        "activities":  activities,
        "healthDays":  health_days,
        "error":       None,
    }
    print(json.dumps(manifest))
    log("manifest written — tmpDir cleanup is handled by GarminSyncService (Node.js)")


if __name__ == "__main__":
    main()
