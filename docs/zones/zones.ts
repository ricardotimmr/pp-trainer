// ─────────────────────────────────────────────────────────────────────────────
// Precision Pacers — Training Zone Calculator
// ─────────────────────────────────────────────────────────────────────────────
//
// Methods:
//   Cycling HR    → Karvonen (Heart Rate Reserve)
//   Cycling Power → Coggan/Allen (% FTP)
//   Running HR    → Friel (% LTHR, Option A)
//   Running Pace  → Friel (% Threshold Pace)
//   Swimming Pace → CSS-based (% Critical Swim Speed)
//
// All inputs come from the user's athlete profile in Settings.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Input profile ───────────────────────────────────────────────────────────

export interface AthleteProfile {
  // General — used across sports
  maxHR: number;        // bpm
  restingHR: number;    // bpm

  // Cycling
  bikeFTP: number;      // Watts
  bikeLTHR?: number;    // bpm — optional, improves cycling HR zones if known

  // Running
  runThresholdPace: number; // sec/km  (e.g. 4:18/km → 258)
  runLTHR: number;           // bpm — required for running HR zones (Option A)

  // Swimming
  swimThresholdPace: number; // sec/100m  (e.g. 1:45 → 105)
}

// ─── Output types ─────────────────────────────────────────────────────────────

export interface HRZone {
  id: string;           // "Z1" … "Z5"
  name: string;
  low: number;          // bpm (inclusive)
  high: number;         // bpm (inclusive)
}

export interface PowerZone {
  id: string;
  name: string;
  low: number;          // Watts
  high: number | null;  // null for open-ended top zone
}

export interface PaceZone {
  id: string;
  name: string;
  slow: number;         // sec/km or sec/100m — upper bound (slower)
  fast: number;         // sec/km or sec/100m — lower bound (faster)
}

export interface TrainingZones {
  cyclingHR: HRZone[];
  cyclingPower: PowerZone[];
  runningHR: HRZone[];
  runningPace: PaceZone[];
  swimmingPace: PaceZone[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Round to nearest integer. */
const r = Math.round;

/**
 * Karvonen formula.
 * Returns the absolute bpm for a given % of Heart Rate Reserve.
 * HRR = maxHR − restingHR
 */
function karvonen(pct: number, maxHR: number, restingHR: number): number {
  return r(restingHR + pct * (maxHR - restingHR));
}

/**
 * Format sec/km or sec/100m as "M:SS".
 * Useful for display — not used in zone objects themselves (raw seconds are
 * easier to compare and sort in code), but exported for convenience.
 */
export function formatPace(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Cycling HR zones (Karvonen / HRR) ───────────────────────────────────────
//
// If the user has supplied bikeLTHR, Z4 is anchored to 95–105% LTHR instead.
// Otherwise pure Karvonen percentages are used throughout.
//
// Percentages (HRR-based, standard 5-zone model):
//   Z1  50–60%
//   Z2  60–70%
//   Z3  70–80%
//   Z4  80–90%
//   Z5  90–100%

function calcCyclingHR(profile: AthleteProfile): HRZone[] {
  const { maxHR, restingHR, bikeLTHR } = profile;

  if (bikeLTHR) {
    // LTHR-anchored: Z4 = 95–105% LTHR, others derived proportionally
    return [
      { id: "Z1", name: "Recovery",   low: r(bikeLTHR * 0.68), high: r(bikeLTHR * 0.80) },
      { id: "Z2", name: "Endurance",  low: r(bikeLTHR * 0.81), high: r(bikeLTHR * 0.89) },
      { id: "Z3", name: "Tempo",      low: r(bikeLTHR * 0.90), high: r(bikeLTHR * 0.94) },
      { id: "Z4", name: "Threshold",  low: r(bikeLTHR * 0.95), high: r(bikeLTHR * 1.05) },
      { id: "Z5", name: "VO2 Max",    low: r(bikeLTHR * 1.06), high: maxHR },
    ];
  }

  // Pure Karvonen fallback
  return [
    { id: "Z1", name: "Recovery",  low: karvonen(0.50, maxHR, restingHR), high: karvonen(0.60, maxHR, restingHR) },
    { id: "Z2", name: "Endurance", low: karvonen(0.60, maxHR, restingHR), high: karvonen(0.70, maxHR, restingHR) },
    { id: "Z3", name: "Tempo",     low: karvonen(0.70, maxHR, restingHR), high: karvonen(0.80, maxHR, restingHR) },
    { id: "Z4", name: "Threshold", low: karvonen(0.80, maxHR, restingHR), high: karvonen(0.90, maxHR, restingHR) },
    { id: "Z5", name: "VO2 Max",   low: karvonen(0.90, maxHR, restingHR), high: maxHR },
  ];
}

// ─── Cycling Power zones (Coggan/Allen % FTP) ────────────────────────────────
//
//   Z1  Active Recovery   < 55% FTP
//   Z2  Endurance         56–75%
//   Z3  Tempo             76–90%
//   Z4  Threshold         91–105%
//   Z5  VO2 Max           106–120%
//   Z6  Anaerobic         121–150%   (included but hidden in UI if not needed)

function calcCyclingPower(profile: AthleteProfile): PowerZone[] {
  const { bikeFTP: ftp } = profile;
  return [
    { id: "Z1", name: "Active Recovery", low: 0,              high: r(ftp * 0.55) },
    { id: "Z2", name: "Endurance",       low: r(ftp * 0.56),  high: r(ftp * 0.75) },
    { id: "Z3", name: "Tempo",           low: r(ftp * 0.76),  high: r(ftp * 0.90) },
    { id: "Z4", name: "Threshold",       low: r(ftp * 0.91),  high: r(ftp * 1.05) },
    { id: "Z5", name: "VO2 Max",         low: r(ftp * 1.06),  high: r(ftp * 1.20) },
    { id: "Z6", name: "Anaerobic",       low: r(ftp * 1.21),  high: null },
  ];
}

// ─── Running HR zones (Friel % LTHR — Option A) ──────────────────────────────
//
// runLTHR is the anchor. Z4 sits right at the lactate threshold.
//
//   Z1  < 85% LTHR
//   Z2  85–89% LTHR
//   Z3  90–94% LTHR
//   Z4  95–99% LTHR   ← threshold zone
//   Z5  ≥ 100% LTHR   (capped at maxHR)

function calcRunningHR(profile: AthleteProfile): HRZone[] {
  const { runLTHR, maxHR } = profile;
  return [
    { id: "Z1", name: "Easy",      low: 0,                  high: r(runLTHR * 0.84) },
    { id: "Z2", name: "Aerobic",   low: r(runLTHR * 0.85),  high: r(runLTHR * 0.89) },
    { id: "Z3", name: "Tempo",     low: r(runLTHR * 0.90),  high: r(runLTHR * 0.94) },
    { id: "Z4", name: "Threshold", low: r(runLTHR * 0.95),  high: r(runLTHR * 0.99) },
    { id: "Z5", name: "VO2 Max",   low: r(runLTHR * 1.00),  high: maxHR },
  ];
}

// ─── Running Pace zones (Friel % Threshold Pace) ─────────────────────────────
//
// T = runThresholdPace in sec/km.
// Higher sec value = slower pace, so zone bounds are inverted vs HR/power:
//   slow = upper bound (easier), fast = lower bound (harder).
//
//   Z1  Easy        129–145% T   (slowest)
//   Z2  Steady      114–128% T
//   Z3  Tempo       106–113% T
//   Z4  Threshold    99–105% T   ← around T-Pace
//   Z5  VO2 Max      90–98% T   (fastest)

function calcRunningPace(profile: AthleteProfile): PaceZone[] {
  const t = profile.runThresholdPace;
  return [
    { id: "Z1", name: "Easy",      slow: r(t * 1.45), fast: r(t * 1.29) },
    { id: "Z2", name: "Steady",    slow: r(t * 1.28), fast: r(t * 1.14) },
    { id: "Z3", name: "Tempo",     slow: r(t * 1.13), fast: r(t * 1.06) },
    { id: "Z4", name: "Threshold", slow: r(t * 1.05), fast: r(t * 0.99) },
    { id: "Z5", name: "VO2 Max",   slow: r(t * 0.98), fast: r(t * 0.90) },
  ];
}

// ─── Swimming Pace zones (CSS-based) ─────────────────────────────────────────
//
// CSS = swimThresholdPace in sec/100m.
// Same inversion logic as running pace (higher = slower).
//
//   Z1  Easy       112–125% CSS
//   Z2  Steady     104–112% CSS
//   Z3  Threshold   97–104% CSS
//   Z4  VO2 Max     88–97% CSS

function calcSwimmingPace(profile: AthleteProfile): PaceZone[] {
  const css = profile.swimThresholdPace;
  return [
    { id: "Z1", name: "Easy",      slow: r(css * 1.25), fast: r(css * 1.12) },
    { id: "Z2", name: "Steady",    slow: r(css * 1.12), fast: r(css * 1.04) },
    { id: "Z3", name: "Threshold", slow: r(css * 1.04), fast: r(css * 0.97) },
    { id: "Z4", name: "VO2 Max",   slow: r(css * 0.97), fast: r(css * 0.88) },
  ];
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Calculate all training zones from an athlete profile.
 *
 * Usage:
 *   const zones = calculateZones(athleteProfile);
 *   zones.runningHR   // HRZone[]
 *   zones.cyclingPower // PowerZone[]
 *   // etc.
 */
export function calculateZones(profile: AthleteProfile): TrainingZones {
  return {
    cyclingHR:    calcCyclingHR(profile),
    cyclingPower: calcCyclingPower(profile),
    runningHR:    calcRunningHR(profile),
    runningPace:  calcRunningPace(profile),
    swimmingPace: calcSwimmingPace(profile),
  };
}

// ─── Example / smoke-test ─────────────────────────────────────────────────────
//
// Run with:  npx ts-node calculateZones.ts
//
// Profile matches the current app mock data (Jonas Reineke / Settings page).

if (require.main === module) {
  const profile: AthleteProfile = {
    maxHR: 194,
    restingHR: 47,
    bikeFTP: 285,
    bikeLTHR: undefined,       // not set → pure Karvonen
    runThresholdPace: 258,     // 4:18/km
    runLTHR: 180,              // bpm (Friel Option A)
    swimThresholdPace: 105,    // 1:45/100m
  };

  const zones = calculateZones(profile);

  console.log("\n── Cycling HR ─────────────────────────────");
  zones.cyclingHR.forEach(z =>
    console.log(`  ${z.id} ${z.name.padEnd(14)} ${z.low}–${z.high} bpm`)
  );

  console.log("\n── Cycling Power ──────────────────────────");
  zones.cyclingPower.forEach(z =>
    console.log(`  ${z.id} ${z.name.padEnd(16)} ${z.low}–${z.high ?? "∞"} W`)
  );

  console.log("\n── Running HR (Friel / LTHR) ──────────────");
  zones.runningHR.forEach(z =>
    console.log(`  ${z.id} ${z.name.padEnd(12)} ${z.low}–${z.high} bpm`)
  );

  console.log("\n── Running Pace ───────────────────────────");
  zones.runningPace.forEach(z =>
    console.log(`  ${z.id} ${z.name.padEnd(12)} ${formatPace(z.fast)}–${formatPace(z.slow)} /km`)
  );

  console.log("\n── Swimming Pace ──────────────────────────");
  zones.swimmingPace.forEach(z =>
    console.log(`  ${z.id} ${z.name.padEnd(12)} ${formatPace(z.fast)}–${formatPace(z.slow)} /100m`)
  );
}