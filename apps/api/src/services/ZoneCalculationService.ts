import type { AthleteProfile, SportType, TrainingZoneType, TrainingZoneUnit } from '@prisma/client';

const r = Math.round;

type ZonePayload = {
  zoneNumber: number;
  name: string;
  lowerBound: number | null;
  upperBound: number | null;
  unit: TrainingZoneUnit;
};

export type ZoneSetPayload = {
  zoneType: TrainingZoneType;
  sport: SportType | null;
  name: string;
  basedOn: string;
  zones: ZonePayload[];
};

function buildCyclingHR(bikeLTHR: number, maxHR: number): ZoneSetPayload {
  const zones: ZonePayload[] = [
    { zoneNumber: 1, name: 'Recovery',  lowerBound: 0,                   upperBound: r(bikeLTHR * 0.84), unit: 'Bpm' },
    { zoneNumber: 2, name: 'Endurance', lowerBound: r(bikeLTHR * 0.85),  upperBound: r(bikeLTHR * 0.89), unit: 'Bpm' },
    { zoneNumber: 3, name: 'Tempo',     lowerBound: r(bikeLTHR * 0.90),  upperBound: r(bikeLTHR * 0.94), unit: 'Bpm' },
    { zoneNumber: 4, name: 'Threshold', lowerBound: r(bikeLTHR * 0.95),  upperBound: r(bikeLTHR * 1.05), unit: 'Bpm' },
    { zoneNumber: 5, name: 'VO2 Max',   lowerBound: r(bikeLTHR * 1.06),  upperBound: maxHR,              unit: 'Bpm' },
  ];
  return { zoneType: 'HeartRate', sport: 'Cycling', name: 'Cycling Heart Rate', basedOn: 'Friel (% Cycling LTHR)', zones };
}

function buildCyclingPower(ftp: number): ZoneSetPayload {
  const zones: ZonePayload[] = [
    { zoneNumber: 1, name: 'Active Recovery', lowerBound: 0,            upperBound: r(ftp * 0.55), unit: 'Watts' },
    { zoneNumber: 2, name: 'Endurance',       lowerBound: r(ftp * 0.56), upperBound: r(ftp * 0.75), unit: 'Watts' },
    { zoneNumber: 3, name: 'Tempo',           lowerBound: r(ftp * 0.76), upperBound: r(ftp * 0.90), unit: 'Watts' },
    { zoneNumber: 4, name: 'Threshold',       lowerBound: r(ftp * 0.91), upperBound: r(ftp * 1.05), unit: 'Watts' },
    { zoneNumber: 5, name: 'VO2 Max',         lowerBound: r(ftp * 1.06), upperBound: r(ftp * 1.20), unit: 'Watts' },
    { zoneNumber: 6, name: 'Anaerobic',       lowerBound: r(ftp * 1.21), upperBound: null,           unit: 'Watts' },
  ];
  return { zoneType: 'CyclingPower', sport: 'Cycling', name: 'Cycling Power', basedOn: 'Coggan/Allen (% FTP)', zones };
}

function buildRunningHR(runLTHR: number, maxHR: number): ZoneSetPayload {
  const zones: ZonePayload[] = [
    { zoneNumber: 1, name: 'Easy',      lowerBound: 0,                   upperBound: r(runLTHR * 0.84), unit: 'Bpm' },
    { zoneNumber: 2, name: 'Aerobic',   lowerBound: r(runLTHR * 0.85),   upperBound: r(runLTHR * 0.89), unit: 'Bpm' },
    { zoneNumber: 3, name: 'Tempo',     lowerBound: r(runLTHR * 0.90),   upperBound: r(runLTHR * 0.94), unit: 'Bpm' },
    { zoneNumber: 4, name: 'Threshold', lowerBound: r(runLTHR * 0.95),   upperBound: r(runLTHR * 0.99), unit: 'Bpm' },
    { zoneNumber: 5, name: 'VO2 Max',   lowerBound: r(runLTHR * 1.00),   upperBound: maxHR,             unit: 'Bpm' },
  ];
  return { zoneType: 'HeartRate', sport: 'Running', name: 'Running Heart Rate', basedOn: 'Friel (% LTHR)', zones };
}

function buildRunningPace(thresholdPace: number): ZoneSetPayload {
  const t = thresholdPace;
  // lowerBound = fast (fewer sec/km), upperBound = slow (more sec/km)
  const zones: ZonePayload[] = [
    { zoneNumber: 1, name: 'Easy',      lowerBound: r(t * 1.29), upperBound: r(t * 1.45), unit: 'SecPerKm' },
    { zoneNumber: 2, name: 'Steady',    lowerBound: r(t * 1.14), upperBound: r(t * 1.28), unit: 'SecPerKm' },
    { zoneNumber: 3, name: 'Tempo',     lowerBound: r(t * 1.06), upperBound: r(t * 1.13), unit: 'SecPerKm' },
    { zoneNumber: 4, name: 'Threshold', lowerBound: r(t * 0.99), upperBound: r(t * 1.05), unit: 'SecPerKm' },
    { zoneNumber: 5, name: 'VO2 Max',   lowerBound: r(t * 0.90), upperBound: r(t * 0.98), unit: 'SecPerKm' },
  ];
  return { zoneType: 'RunningPace', sport: 'Running', name: 'Running Pace', basedOn: 'Friel (% Threshold Pace)', zones };
}

function buildSwimmingPace(css: number): ZoneSetPayload {
  // lowerBound = fast, upperBound = slow
  const zones: ZonePayload[] = [
    { zoneNumber: 1, name: 'Easy',      lowerBound: r(css * 1.12), upperBound: r(css * 1.25), unit: 'SecPer100m' },
    { zoneNumber: 2, name: 'Steady',    lowerBound: r(css * 1.04), upperBound: r(css * 1.12), unit: 'SecPer100m' },
    { zoneNumber: 3, name: 'Threshold', lowerBound: r(css * 0.97), upperBound: r(css * 1.04), unit: 'SecPer100m' },
    { zoneNumber: 4, name: 'VO2 Max',   lowerBound: r(css * 0.88), upperBound: r(css * 0.97), unit: 'SecPer100m' },
  ];
  return { zoneType: 'SwimmingPace', sport: 'Swimming', name: 'Swimming Pace', basedOn: 'CSS (% Critical Swim Speed)', zones };
}

export function buildZonePayloads(profile: AthleteProfile): ZoneSetPayload[] {
  const payloads: ZoneSetPayload[] = [];

  const { maxHeartRateBpm, currentFtpWatts,
          cyclingThresholdHrBpm, runningThresholdHrBpm, runningThresholdPaceSecPerKm,
          swimmingThresholdPaceSecPer100m } = profile;

  if (cyclingThresholdHrBpm != null && maxHeartRateBpm != null) {
    payloads.push(buildCyclingHR(cyclingThresholdHrBpm, maxHeartRateBpm));
  }
  if (currentFtpWatts != null) {
    payloads.push(buildCyclingPower(currentFtpWatts));
  }
  if (runningThresholdHrBpm != null && maxHeartRateBpm != null) {
    payloads.push(buildRunningHR(runningThresholdHrBpm, maxHeartRateBpm));
  }
  if (runningThresholdPaceSecPerKm != null) {
    payloads.push(buildRunningPace(runningThresholdPaceSecPerKm));
  }
  if (swimmingThresholdPaceSecPer100m != null) {
    payloads.push(buildSwimmingPace(swimmingThresholdPaceSecPer100m));
  }

  return payloads;
}
