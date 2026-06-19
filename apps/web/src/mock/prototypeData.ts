import type {
  Activity,
  ActivityLap,
  ActivityStrengthExercise,
  ActivityStrengthSet,
  ActivitySwimLap,
  ActivityTimeSeriesSample,
  AiCoachPreview,
  AthleteProfile,
  PerformanceStats,
  PlannedWorkout,
  RacePrediction,
  TimeInZone,
  TrainingGoal,
  TrainingPlan,
  TrainingZone,
  TrainingZoneSet,
  WeeklySummary,
  WorkoutStep,
} from './prototypeData.types';

const now = '2026-06-15T08:00:00.000Z';

// ---------------------------------------------------------------------------
// Time series generators — deterministic wave-based mock data
// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function wave(t: number, freq: number, amp: number): number {
  return Math.sin(t * Math.PI * freq) * amp;
}

function makeCyclingTimeSeries(
  durationSeconds: number,
  avgHr: number,
  avgPower: number,
  avgCadence: number,
  elevationGain: number,
  hasIntervals = false,
): ActivityTimeSeriesSample[] {
  const step = 60;
  const n = Math.floor(durationSeconds / step);
  return Array.from({ length: n }, (_, i) => {
    const t = n > 1 ? i / (n - 1) : 0;
    const warmup = t < 0.12 ? (t / 0.12) * 14 : 14;
    const drift = t * 6;
    const hrWave = wave(t, 5, 9) + wave(t, 11, 4);
    const inInterval =
      hasIntervals &&
      ((t > 0.30 && t < 0.42) || (t > 0.52 && t < 0.64) || (t > 0.72 && t < 0.84));
    const inValley =
      hasIntervals &&
      ((t > 0.42 && t < 0.52) || (t > 0.64 && t < 0.72));
    const hr = clamp(
      Math.round(avgHr - 14 + warmup + drift + hrWave + (inInterval ? 22 : 0)),
      90,
      194,
    );
    const pwrWave = wave(t, 7, 35) + wave(t, 3, 18);
    const pwr = Math.max(
      0,
      Math.round(avgPower + pwrWave + (inInterval ? 62 : inValley ? -46 : 0)),
    );
    const cadence = clamp(Math.round(avgCadence + wave(t, 4, 5)), 60, 115);
    const spd = Math.round(((pwr / avgPower) * 28 + (pwr === 0 ? 0 : 3)) * 10) / 10;
    const elev = Math.max(
      0,
      Math.round(
        elevationGain * 0.5 * (1 - Math.cos(t * Math.PI * 2)) * 0.65 +
          wave(t, 4, elevationGain * 0.06),
      ),
    );
    return {
      offsetSeconds: i * step,
      heartRateBpm: hr,
      powerWatts: pwr,
      cadenceRpm: cadence,
      speedKmh: Math.max(0, spd),
      elevationMeters: Math.max(0, elev),
    };
  });
}

function makeRunTimeSeries(
  durationSeconds: number,
  avgHr: number,
  avgPaceSecPerKm: number,
  avgCadence: number,
  elevationGain: number,
  hasTempo = false,
): ActivityTimeSeriesSample[] {
  const step = 60;
  const n = Math.floor(durationSeconds / step);
  return Array.from({ length: n }, (_, i) => {
    const t = n > 1 ? i / (n - 1) : 0;
    const warmup = t < 0.12 ? (t / 0.12) * 10 : 10;
    const drift = t * 7;
    const hrWave = wave(t, 4, 6);
    const tempoActive = hasTempo && t > 0.20 && t < 0.88;
    const hr = clamp(
      Math.round(avgHr - 10 + warmup + drift + hrWave + (tempoActive ? 20 : 0)),
      95,
      194,
    );
    const paceWave = wave(t, 5, 18);
    const pace = Math.max(
      210,
      Math.round(avgPaceSecPerKm + paceWave + (tempoActive ? -58 : 0)),
    );
    const cadence = clamp(Math.round(avgCadence + wave(t, 3, 4)), 155, 192);
    const elev = Math.max(
      0,
      Math.round(
        elevationGain * 0.5 * (1 - Math.cos(t * Math.PI * 2)) * 0.5 +
          wave(t, 3, 5),
      ),
    );
    return {
      offsetSeconds: i * step,
      heartRateBpm: hr,
      paceSecPerKm: pace,
      cadenceRpm: cadence,
      elevationMeters: Math.max(0, elev),
    };
  });
}

function makeSwimTimeSeries(
  laps: ActivitySwimLap[],
  streamDurationSeconds: number,
  avgHr: number,
): ActivityTimeSeriesSample[] {
  const samples: ActivityTimeSeriesSample[] = [];
  let offsetSeconds = 0;

  laps.forEach((lap, index) => {
    const sampleCount = Math.max(2, Math.round(lap.durationSeconds / 30));

    Array.from({ length: sampleCount }, (_, sampleIndex) => {
      const lapProgress = sampleCount > 1 ? sampleIndex / (sampleCount - 1) : 0;
      const totalProgress =
        streamDurationSeconds > 0 ? offsetSeconds / streamDurationSeconds : 0;
      const drillPenalty = lap.strokeType === 'drill' ? 8 : 0;
      const pace = Math.round(
        (lap.averagePaceSecPer100m ?? lap.durationSeconds) +
          drillPenalty +
          wave(lapProgress + index * 0.07, 2, 3),
      );
      const hr = clamp(
        Math.round(
          avgHr -
            12 +
            totalProgress * 14 +
            wave(totalProgress, 4, 5) +
            (lap.averageHeartRateBpm ? (lap.averageHeartRateBpm - avgHr) * 0.7 : 0),
        ),
        90,
        178,
      );

      samples.push({
        offsetSeconds: Math.min(
          streamDurationSeconds,
          Math.round(offsetSeconds + lap.durationSeconds * lapProgress),
        ),
        heartRateBpm: hr,
        swimPaceSecPer100m: clamp(pace, 82, 145),
      });
    });

    offsetSeconds += lap.durationSeconds;
  });

  const lastSample = samples[samples.length - 1];

  if (lastSample && lastSample.offsetSeconds < streamDurationSeconds) {
    samples.push({
      ...lastSample,
      offsetSeconds: streamDurationSeconds,
    });
  }

  return samples;
}

// ---------------------------------------------------------------------------
// Athlete profile
// ---------------------------------------------------------------------------

export const prototypeAthleteProfile: AthleteProfile = {
  id: 'athlete-ricardo',
  displayName: 'Ricardo',
  birthYear: 1998,
  bodyWeightKg: 76,
  heightCm: 181,
  primarySports: ['cycling', 'running', 'swimming', 'strength'],
  currentFtpWatts: 285,
  maxHeartRateBpm: 194,
  restingHeartRateBpm: 47,
  runningThresholdPaceSecPerKm: 258,
  swimmingThresholdPaceSecPer100m: 105,
  preferredTrainingDays: [
    { weekday: 'monday', available: true, maxDurationMinutes: 60, preferredSports: ['swimming', 'mobility'] },
    { weekday: 'tuesday', available: true, maxDurationMinutes: 90, preferredSports: ['cycling', 'running'] },
    { weekday: 'wednesday', available: true, maxDurationMinutes: 60, preferredSports: ['running', 'strength'] },
    { weekday: 'thursday', available: true, maxDurationMinutes: 90, preferredSports: ['cycling'] },
    { weekday: 'friday', available: true, maxDurationMinutes: 45, preferredSports: ['swimming', 'mobility'] },
    { weekday: 'saturday', available: true, maxDurationMinutes: 180, preferredSports: ['cycling'] },
    { weekday: 'sunday', available: true, maxDurationMinutes: 100, preferredSports: ['running'] },
  ],
  notes: 'Single-user MVP athlete profile for validating triathlon-oriented planning screens.',
  createdAt: '2026-06-01T08:00:00.000Z',
  updatedAt: now,
};

// ---------------------------------------------------------------------------
// Training goals
// ---------------------------------------------------------------------------

export const prototypeTrainingGoals: TrainingGoal[] = [
  {
    id: 'goal-olympic-triathlon',
    athleteProfileId: prototypeAthleteProfile.id,
    title: 'Olympic triathlon build',
    goalType: 'race',
    targetDate: '2026-09-06',
    sport: 'other',
    priority: 'main_goal',
    targetDistanceMeters: 51500,
    targetDurationSeconds: 9000,
    description: 'Prepare for an Olympic-distance triathlon with balanced bike, run and swim development.',
    isActive: true,
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: now,
  },
  {
    id: 'goal-run-10k-threshold',
    athleteProfileId: prototypeAthleteProfile.id,
    title: 'Sub-42 10K benchmark',
    goalType: 'performance',
    targetDate: '2026-08-02',
    sport: 'running',
    priority: 'secondary_goal',
    targetDistanceMeters: 10000,
    targetDurationSeconds: 2520,
    targetPaceSecPerKm: 252,
    description: 'Use a late-summer 10K as a controlled run fitness checkpoint without compromising triathlon preparation.',
    isActive: true,
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: now,
  },
  {
    id: 'goal-swim-consistency',
    athleteProfileId: prototypeAthleteProfile.id,
    title: 'Consistent open-water swim rhythm',
    goalType: 'fitness',
    targetDate: '2026-07-19',
    sport: 'swimming',
    priority: 'watchlist',
    targetDistanceMeters: 1900,
    targetSwimPaceSecPer100m: 108,
    description: 'Keep swim confidence and pacing visible, but do not let it drive dedicated training load decisions.',
    isActive: true,
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: now,
  },
];

// ---------------------------------------------------------------------------
// Training zone sets and zones
// ---------------------------------------------------------------------------

export const prototypeTrainingZoneSets: TrainingZoneSet[] = [
  { id: 'zone-set-hr-cycling', athleteProfileId: prototypeAthleteProfile.id, sport: 'cycling', zoneType: 'heart_rate', name: 'Cycling HR Zones', basedOn: 'Max heart rate 194 bpm · cycling', isActive: true, createdAt: '2026-06-01T08:00:00.000Z', updatedAt: now },
  { id: 'zone-set-hr-running', athleteProfileId: prototypeAthleteProfile.id, sport: 'running', zoneType: 'heart_rate', name: 'Running HR Zones', basedOn: 'Max heart rate 194 bpm · running', isActive: true, createdAt: '2026-06-01T08:00:00.000Z', updatedAt: now },
  { id: 'zone-set-cycling-power', athleteProfileId: prototypeAthleteProfile.id, sport: 'cycling', zoneType: 'cycling_power', name: 'Cycling Power Zones', basedOn: 'FTP 285 W', isActive: true, createdAt: '2026-06-01T08:00:00.000Z', updatedAt: now },
  { id: 'zone-set-running-pace', athleteProfileId: prototypeAthleteProfile.id, sport: 'running', zoneType: 'running_pace', name: 'Running Pace Zones', basedOn: 'Threshold pace 4:18 min/km', isActive: true, createdAt: '2026-06-01T08:00:00.000Z', updatedAt: now },
  { id: 'zone-set-swimming-pace', athleteProfileId: prototypeAthleteProfile.id, sport: 'swimming', zoneType: 'swimming_pace', name: 'Swimming Pace Zones', basedOn: 'Threshold pace 1:45 min/100m', isActive: true, createdAt: '2026-06-01T08:00:00.000Z', updatedAt: now },
];

export const prototypeTrainingZones: TrainingZone[] = [
  { id: 'hr-cycling-z1', trainingZoneSetId: 'zone-set-hr-cycling', zoneNumber: 1, name: 'Recovery', lowerBound: 95, upperBound: 120, unit: 'bpm' },
  { id: 'hr-cycling-z2', trainingZoneSetId: 'zone-set-hr-cycling', zoneNumber: 2, name: 'Endurance', lowerBound: 121, upperBound: 141, unit: 'bpm' },
  { id: 'hr-cycling-z3', trainingZoneSetId: 'zone-set-hr-cycling', zoneNumber: 3, name: 'Tempo', lowerBound: 142, upperBound: 160, unit: 'bpm' },
  { id: 'hr-cycling-z4', trainingZoneSetId: 'zone-set-hr-cycling', zoneNumber: 4, name: 'Threshold', lowerBound: 161, upperBound: 175, unit: 'bpm' },
  { id: 'hr-cycling-z5', trainingZoneSetId: 'zone-set-hr-cycling', zoneNumber: 5, name: 'VO2 Max', lowerBound: 176, upperBound: 194, unit: 'bpm' },
  { id: 'hr-running-z1', trainingZoneSetId: 'zone-set-hr-running', zoneNumber: 1, name: 'Easy', lowerBound: 97, upperBound: 128, unit: 'bpm' },
  { id: 'hr-running-z2', trainingZoneSetId: 'zone-set-hr-running', zoneNumber: 2, name: 'Endurance', lowerBound: 129, upperBound: 149, unit: 'bpm' },
  { id: 'hr-running-z3', trainingZoneSetId: 'zone-set-hr-running', zoneNumber: 3, name: 'Tempo', lowerBound: 150, upperBound: 168, unit: 'bpm' },
  { id: 'hr-running-z4', trainingZoneSetId: 'zone-set-hr-running', zoneNumber: 4, name: 'Threshold', lowerBound: 169, upperBound: 182, unit: 'bpm' },
  { id: 'hr-running-z5', trainingZoneSetId: 'zone-set-hr-running', zoneNumber: 5, name: 'VO2 Max', lowerBound: 183, upperBound: 194, unit: 'bpm' },
  { id: 'bike-pz1', trainingZoneSetId: 'zone-set-cycling-power', zoneNumber: 1, name: 'Active Recovery', lowerBound: 0, upperBound: 157, unit: 'watts' },
  { id: 'bike-pz2', trainingZoneSetId: 'zone-set-cycling-power', zoneNumber: 2, name: 'Endurance', lowerBound: 158, upperBound: 213, unit: 'watts' },
  { id: 'bike-pz3', trainingZoneSetId: 'zone-set-cycling-power', zoneNumber: 3, name: 'Tempo', lowerBound: 214, upperBound: 256, unit: 'watts' },
  { id: 'bike-pz4', trainingZoneSetId: 'zone-set-cycling-power', zoneNumber: 4, name: 'Threshold', lowerBound: 257, upperBound: 299, unit: 'watts' },
  { id: 'bike-pz5', trainingZoneSetId: 'zone-set-cycling-power', zoneNumber: 5, name: 'VO2 Max', lowerBound: 300, upperBound: 342, unit: 'watts' },
  { id: 'run-pace-z1', trainingZoneSetId: 'zone-set-running-pace', zoneNumber: 1, name: 'Easy', lowerBound: 330, upperBound: 390, unit: 'sec_per_km' },
  { id: 'run-pace-z2', trainingZoneSetId: 'zone-set-running-pace', zoneNumber: 2, name: 'Steady', lowerBound: 300, upperBound: 329, unit: 'sec_per_km' },
  { id: 'run-pace-z3', trainingZoneSetId: 'zone-set-running-pace', zoneNumber: 3, name: 'Tempo', lowerBound: 270, upperBound: 299, unit: 'sec_per_km' },
  { id: 'run-pace-z4', trainingZoneSetId: 'zone-set-running-pace', zoneNumber: 4, name: 'Threshold', lowerBound: 248, upperBound: 269, unit: 'sec_per_km' },
  { id: 'swim-pace-z1', trainingZoneSetId: 'zone-set-swimming-pace', zoneNumber: 1, name: 'Easy', lowerBound: 118, upperBound: 135, unit: 'sec_per_100m' },
  { id: 'swim-pace-z2', trainingZoneSetId: 'zone-set-swimming-pace', zoneNumber: 2, name: 'Steady', lowerBound: 108, upperBound: 117, unit: 'sec_per_100m' },
  { id: 'swim-pace-z3', trainingZoneSetId: 'zone-set-swimming-pace', zoneNumber: 3, name: 'Threshold', lowerBound: 100, upperBound: 107, unit: 'sec_per_100m' },
  { id: 'swim-pace-z4', trainingZoneSetId: 'zone-set-swimming-pace', zoneNumber: 4, name: 'VO2 Max', lowerBound: 92, upperBound: 99, unit: 'sec_per_100m' },
];

// ---------------------------------------------------------------------------
// Reusable HR zone helpers
// ---------------------------------------------------------------------------

function hrZones(durations: [number, number, number, number, number]): TimeInZone[] {
  const names = ['Recovery', 'Endurance', 'Tempo', 'Threshold', 'VO2 Max'];
  const total = durations.reduce((a, b) => a + b, 0);
  return durations.map((d, i) => ({
    zoneNumber: i + 1,
    zoneName: names[i],
    durationSeconds: d,
    percentage: Math.round((d / total) * 100),
  }));
}

// ---------------------------------------------------------------------------
// Cycling lap helpers
// ---------------------------------------------------------------------------

function bikeLap(
  lapNumber: number,
  distanceMeters: number,
  durationSeconds: number,
  averageHeartRateBpm: number,
  averagePowerWatts: number,
  averageCadence: number,
  elevationGainMeters = 0,
): ActivityLap {
  return {
    lapNumber,
    distanceMeters,
    durationSeconds,
    averageHeartRateBpm,
    averagePowerWatts,
    averageCadence,
    averageSpeedKmh: Math.round((distanceMeters / durationSeconds) * 3.6 * 10) / 10,
    elevationGainMeters,
  };
}

function runLap(
  lapNumber: number,
  distanceMeters: number,
  durationSeconds: number,
  averageHeartRateBpm: number,
  averageCadence: number,
): ActivityLap {
  return {
    lapNumber,
    distanceMeters,
    durationSeconds,
    averageHeartRateBpm,
    averagePaceSecPerKm: Math.round(durationSeconds / (distanceMeters / 1000)),
    averageCadence,
  };
}

function swimLap(
  lapNumber: number,
  durationSeconds: number,
  strokeType: ActivitySwimLap['strokeType'],
  strokeCount: number,
  averageHeartRateBpm: number,
): ActivitySwimLap {
  const swolfScore = Math.round(strokeCount / 4 + durationSeconds / 4);
  return {
    lapNumber,
    distanceMeters: 100,
    durationSeconds,
    strokeType,
    strokeCount,
    swolfScore,
    averagePaceSecPer100m: durationSeconds,
    averageHeartRateBpm,
  };
}

const swimTechniqueLaps: ActivitySwimLap[] = [
  // warmup 400m (4 x 100m)
  swimLap(1, 118, 'freestyle', 66, 112),
  swimLap(2, 115, 'freestyle', 64, 116),
  swimLap(3, 114, 'freestyle', 63, 118),
  swimLap(4, 113, 'freestyle', 62, 120),
  // drill block 400m (4 x 100m)
  swimLap(5, 130, 'drill', 72, 120),
  swimLap(6, 126, 'drill', 70, 122),
  swimLap(7, 128, 'drill', 71, 121),
  swimLap(8, 125, 'drill', 69, 122),
  // main set 5 x 200m = 10 x 100m
  swimLap(9, 112, 'freestyle', 62, 128),
  swimLap(10, 111, 'freestyle', 62, 130),
  swimLap(11, 112, 'freestyle', 63, 131),
  swimLap(12, 110, 'freestyle', 61, 132),
  swimLap(13, 111, 'freestyle', 62, 133),
  swimLap(14, 112, 'freestyle', 63, 133),
  swimLap(15, 113, 'freestyle', 63, 134),
  swimLap(16, 112, 'freestyle', 62, 134),
  swimLap(17, 113, 'freestyle', 63, 133),
  swimLap(18, 114, 'freestyle', 64, 132),
  // cooldown 400m (4 x 100m)
  swimLap(19, 118, 'freestyle', 66, 130),
  swimLap(20, 120, 'freestyle', 68, 127),
  swimLap(21, 122, 'freestyle', 69, 124),
  swimLap(22, 124, 'freestyle', 70, 121),
];

const swimEnduranceLaps: ActivitySwimLap[] = [
  // warmup 500m (5 x 100m)
  swimLap(1, 108, 'freestyle', 64, 115),
  swimLap(2, 105, 'freestyle', 62, 120),
  swimLap(3, 103, 'freestyle', 61, 122),
  swimLap(4, 102, 'freestyle', 60, 124),
  swimLap(5, 102, 'freestyle', 60, 125),
  // main set 5 x 400m (20 x 100m)
  swimLap(6, 100, 'freestyle', 58, 128),
  swimLap(7, 99, 'freestyle', 58, 129),
  swimLap(8, 101, 'freestyle', 59, 130),
  swimLap(9, 100, 'freestyle', 58, 131),
  swimLap(10, 99, 'freestyle', 58, 132),
  swimLap(11, 101, 'freestyle', 59, 132),
  swimLap(12, 100, 'freestyle', 58, 133),
  swimLap(13, 102, 'freestyle', 59, 133),
  swimLap(14, 100, 'freestyle', 58, 134),
  swimLap(15, 99, 'freestyle', 58, 134),
  swimLap(16, 101, 'freestyle', 59, 134),
  swimLap(17, 103, 'freestyle', 60, 135),
  swimLap(18, 102, 'freestyle', 59, 135),
  swimLap(19, 104, 'freestyle', 60, 134),
  swimLap(20, 103, 'freestyle', 60, 133),
  swimLap(21, 102, 'freestyle', 59, 133),
  swimLap(22, 104, 'freestyle', 60, 132),
  swimLap(23, 103, 'freestyle', 60, 131),
  swimLap(24, 105, 'freestyle', 61, 130),
  swimLap(25, 104, 'freestyle', 61, 129),
  // cooldown 300m (3 x 100m)
  swimLap(26, 108, 'freestyle', 63, 128),
  swimLap(27, 110, 'freestyle', 64, 125),
  swimLap(28, 112, 'freestyle', 65, 122),
];

function strengthSet(set: ActivityStrengthSet): ActivityStrengthSet {
  return {
    ...set,
    id: `strength-lower-body-set-${set.setNumber}`,
  };
}

const lowerBodyStrengthSets: ActivityStrengthSet[] = [
  strengthSet(
  {
    setNumber: 1,
    exerciseName: 'Goblet squat',
    exerciseCategory: 'Squat',
    muscleGroup: 'Quads',
    reps: 10,
    weightKg: 28,
    durationSeconds: 52,
    restSeconds: 75,
    notes: 'Controlled tempo',
  },
  ),
  strengthSet(
  {
    setNumber: 2,
    exerciseName: 'Goblet squat',
    exerciseCategory: 'Squat',
    muscleGroup: 'Quads',
    reps: 10,
    weightKg: 30,
    durationSeconds: 54,
    restSeconds: 85,
  },
  ),
  strengthSet(
  {
    setNumber: 3,
    exerciseName: 'Goblet squat',
    exerciseCategory: 'Squat',
    muscleGroup: 'Quads',
    reps: 8,
    weightKg: 32,
    durationSeconds: 48,
    restSeconds: 95,
  },
  ),
  strengthSet(
  {
    setNumber: 4,
    exerciseName: 'Romanian deadlift',
    exerciseCategory: 'Hinge',
    muscleGroup: 'Hamstrings',
    reps: 10,
    weightKg: 55,
    durationSeconds: 58,
    restSeconds: 90,
  },
  ),
  strengthSet(
  {
    setNumber: 5,
    exerciseName: 'Romanian deadlift',
    exerciseCategory: 'Hinge',
    muscleGroup: 'Hamstrings',
    reps: 10,
    weightKg: 60,
    durationSeconds: 60,
    restSeconds: 105,
  },
  ),
  strengthSet(
  {
    setNumber: 6,
    exerciseName: 'Romanian deadlift',
    exerciseCategory: 'Hinge',
    muscleGroup: 'Hamstrings',
    reps: 8,
    weightKg: 65,
    durationSeconds: 55,
    restSeconds: 120,
  },
  ),
  strengthSet(
  {
    setNumber: 7,
    exerciseName: 'Rear-foot elevated split squat',
    exerciseCategory: 'Single-leg',
    muscleGroup: 'Glutes',
    reps: 8,
    weightKg: 20,
    durationSeconds: 64,
    restSeconds: 75,
    notes: 'Each side',
  },
  ),
  strengthSet(
  {
    setNumber: 8,
    exerciseName: 'Rear-foot elevated split squat',
    exerciseCategory: 'Single-leg',
    muscleGroup: 'Glutes',
    reps: 8,
    weightKg: 22,
    durationSeconds: 66,
    restSeconds: 85,
    notes: 'Each side',
  },
  ),
  strengthSet(
  {
    setNumber: 9,
    exerciseName: 'Standing calf raise',
    exerciseCategory: 'Accessory',
    muscleGroup: 'Calves',
    reps: 15,
    weightKg: 24,
    durationSeconds: 42,
    restSeconds: 45,
  },
  ),
  strengthSet(
  {
    setNumber: 10,
    exerciseName: 'Standing calf raise',
    exerciseCategory: 'Accessory',
    muscleGroup: 'Calves',
    reps: 15,
    weightKg: 24,
    durationSeconds: 43,
    restSeconds: 45,
  },
  ),
  strengthSet(
  {
    setNumber: 11,
    exerciseName: 'Side plank',
    exerciseCategory: 'Core',
    muscleGroup: 'Core',
    durationSeconds: 45,
    restSeconds: 30,
    notes: 'Left side',
  },
  ),
  strengthSet(
  {
    setNumber: 12,
    exerciseName: 'Side plank',
    exerciseCategory: 'Core',
    muscleGroup: 'Core',
    durationSeconds: 45,
    restSeconds: 30,
    notes: 'Right side',
  },
  ),
];

function summarizeStrengthExercises(
  sets: ActivityStrengthSet[],
): ActivityStrengthExercise[] {
  const exerciseMap = new Map<string, ActivityStrengthExercise>();

  sets.forEach((set) => {
    const exerciseName = set.exerciseName ?? 'Unknown exercise';
    const current =
      exerciseMap.get(exerciseName) ??
      {
        exerciseName,
        exerciseCategory: set.exerciseCategory,
        muscleGroup: set.muscleGroup,
        sets: 0,
        reps: 0,
        volumeKg: 0,
        bestWeightKg: 0,
      };
    const setVolume =
      set.reps !== undefined && set.weightKg !== undefined
        ? set.reps * set.weightKg
        : 0;

    current.sets += 1;
    current.reps = (current.reps ?? 0) + (set.reps ?? 0);
    current.volumeKg = (current.volumeKg ?? 0) + setVolume;
    current.bestWeightKg = Math.max(current.bestWeightKg ?? 0, set.weightKg ?? 0);
    exerciseMap.set(exerciseName, current);
  });

  return [...exerciseMap.values()].map((exercise) => ({
    ...exercise,
    reps: exercise.reps || undefined,
    volumeKg: exercise.volumeKg || undefined,
    bestWeightKg: exercise.bestWeightKg || undefined,
  }));
}

const lowerBodyStrengthExercises = summarizeStrengthExercises(
  lowerBodyStrengthSets,
);

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export const prototypeActivities: Activity[] = [
  // -------------------------------------------------------------------------
  // 1. Bike endurance — 68.4 km, 2h15, avg HR 137, avg pwr 184 W, NP 211 W
  // -------------------------------------------------------------------------
  {
    id: 'activity-bike-endurance-2026-06-14',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-bike-endurance-2026-06-14',
    title: 'Endurance ride with short climbs',
    sport: 'cycling',
    activityType: 'long',
    startTime: '2026-06-14T07:45:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 8100,
    movingDurationSeconds: 7920,
    distanceMeters: 68400,
    elevationGainMeters: 620,
    averageHeartRateBpm: 137,
    maxHeartRateBpm: 171,
    averagePowerWatts: 184,
    maxPowerWatts: 612,
    normalizedPowerWatts: 211,
    averageSpeedKmh: 31.1,
    maxSpeedKmh: 58.4,
    averageCadence: 86,
    calories: 1780,
    perceivedExertion: 6,
    intensityFactor: 0.74,
    trainingStressScore: 123,
    laps: [
      bikeLap(1,  5000, 578, 122, 162, 83, 18),
      bikeLap(2,  5000, 562, 129, 174, 85, 12),
      bikeLap(3,  5000, 602, 135, 171, 83, 68),
      bikeLap(4,  5000, 554, 134, 183, 87, 22),
      bikeLap(5,  5000, 546, 137, 188, 88, 14),
      bikeLap(6,  5000, 622, 142, 176, 82, 95),
      bikeLap(7,  5000, 592, 147, 194, 82, 48),
      bikeLap(8,  5000, 558, 139, 186, 87, 28),
      bikeLap(9,  5000, 544, 136, 191, 89, 10),
      bikeLap(10, 5000, 580, 138, 182, 86, 35),
      bikeLap(11, 5000, 634, 148, 196, 81, 122),
      bikeLap(12, 5000, 588, 145, 188, 84, 55),
      bikeLap(13, 5000, 572, 141, 182, 87, 30),
      bikeLap(14, 3400, 392, 138, 178, 86, 63),
    ],
    timeInHrZones: hrZones([648, 4860, 1944, 486, 162]),
    timeSeries: makeCyclingTimeSeries(8100, 137, 184, 86, 620, false),
    createdAt: '2026-06-14T10:10:00.000Z',
    updatedAt: '2026-06-14T10:10:00.000Z',
  },

  // -------------------------------------------------------------------------
  // 2. Run easy — 8.2 km, 46 min, avg HR 142
  // -------------------------------------------------------------------------
  {
    id: 'activity-run-easy-2026-06-13',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-run-easy-2026-06-13',
    title: 'Easy aerobic run',
    sport: 'running',
    activityType: 'easy',
    startTime: '2026-06-13T16:30:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 2760,
    movingDurationSeconds: 2730,
    distanceMeters: 8200,
    elevationGainMeters: 48,
    averageHeartRateBpm: 142,
    maxHeartRateBpm: 158,
    averagePaceSecPerKm: 337,
    bestPaceSecPerKm: 278,
    averageCadence: 171,
    calories: 610,
    perceivedExertion: 4,
    laps: [
      runLap(1, 1000, 345, 130, 168),
      runLap(2, 1000, 338, 137, 170),
      runLap(3, 1000, 333, 141, 172),
      runLap(4, 1000, 331, 143, 172),
      runLap(5, 1000, 329, 144, 173),
      runLap(6, 1000, 328, 145, 173),
      runLap(7, 1000, 331, 143, 172),
      runLap(8, 1000, 335, 141, 171),
      runLap(9,  200,  60, 138, 170),
    ],
    timeInHrZones: hrZones([276, 1987, 441, 56, 0]),
    timeSeries: makeRunTimeSeries(2760, 142, 337, 171, 48, false),
    createdAt: '2026-06-13T17:20:00.000Z',
    updatedAt: '2026-06-13T17:20:00.000Z',
  },

  // -------------------------------------------------------------------------
  // 3. Swim technique — 2200 m, 50 min
  // -------------------------------------------------------------------------
  {
    id: 'activity-swim-technique-2026-06-12',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-swim-technique-2026-06-12',
    title: 'Technique swim with pull buoy',
    sport: 'swimming',
    activityType: 'technical',
    startTime: '2026-06-12T05:45:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 3000,
    movingDurationSeconds: 2460,
    distanceMeters: 2200,
    averageHeartRateBpm: 128,
    maxHeartRateBpm: 149,
    averagePaceSecPerKm: 1364,
    calories: 420,
    perceivedExertion: 4,
    poolLengthMeters: 25,
    dominantStrokeType: 'freestyle',
    totalStrokeCount: 1364,
    avgSwolfScore: 43,
    swimLaps: swimTechniqueLaps,
    timeInHrZones: hrZones([1050, 1650, 300, 0, 0]),
    timeSeries: makeSwimTimeSeries(swimTechniqueLaps, 2460, 128),
    createdAt: '2026-06-12T06:40:00.000Z',
    updatedAt: '2026-06-12T06:40:00.000Z',
  },

  // -------------------------------------------------------------------------
  // 4. Bike threshold — 38.5 km, 1h15, avg HR 151, avg pwr 219 W, NP 256 W
  // -------------------------------------------------------------------------
  {
    id: 'activity-bike-threshold-2026-06-11',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-bike-threshold-2026-06-11',
    title: 'Bike threshold intervals',
    sport: 'cycling',
    activityType: 'threshold',
    startTime: '2026-06-11T17:15:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 4500,
    movingDurationSeconds: 4440,
    distanceMeters: 38500,
    elevationGainMeters: 210,
    averageHeartRateBpm: 151,
    maxHeartRateBpm: 183,
    averagePowerWatts: 219,
    maxPowerWatts: 498,
    normalizedPowerWatts: 256,
    averageSpeedKmh: 30.8,
    averageCadence: 91,
    calories: 1040,
    perceivedExertion: 8,
    intensityFactor: 0.90,
    trainingStressScore: 101,
    laps: [
      bikeLap(1, 5000, 618, 136, 178, 88, 28),
      bikeLap(2, 5000, 572, 148, 228, 92, 42),
      bikeLap(3, 5000, 552, 157, 256, 94, 55),
      bikeLap(4, 5000, 598, 151, 208, 89, 18),
      bikeLap(5, 5000, 545, 162, 268, 95, 35),
      bikeLap(6, 5000, 575, 157, 224, 91, 20),
      bikeLap(7, 5000, 538, 165, 278, 95, 12),
      bikeLap(8, 3500, 442, 147, 188, 88, 0),
    ],
    timeInHrZones: hrZones([360, 1260, 1530, 1080, 270]),
    timeSeries: makeCyclingTimeSeries(4500, 151, 219, 91, 210, true),
    createdAt: '2026-06-11T18:35:00.000Z',
    updatedAt: '2026-06-11T18:35:00.000Z',
  },

  // -------------------------------------------------------------------------
  // 5. Strength — 45 min, avg HR 104
  // -------------------------------------------------------------------------
  {
    id: 'activity-strength-2026-06-10',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-strength-2026-06-10',
    title: 'Lower body strength maintenance',
    sport: 'strength',
    activityType: 'strength',
    startTime: '2026-06-10T18:00:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 2700,
    averageHeartRateBpm: 104,
    maxHeartRateBpm: 139,
    calories: 260,
    perceivedExertion: 5,
    notes: 'Squat pattern, single-leg stability and posterior chain work.',
    strengthSets: lowerBodyStrengthSets,
    strengthExercises: lowerBodyStrengthExercises,
    totalSets: lowerBodyStrengthSets.length,
    totalReps: lowerBodyStrengthSets.reduce(
      (total, set) => total + (set.reps ?? 0),
      0,
    ),
    totalVolumeKg: lowerBodyStrengthSets.reduce(
      (total, set) =>
        total + (set.reps ?? 0) * (set.weightKg ?? 0),
      0,
    ),
    timeInHrZones: hrZones([2295, 405, 0, 0, 0]),
    createdAt: '2026-06-10T18:50:00.000Z',
    updatedAt: '2026-06-10T18:50:00.000Z',
  },

  // -------------------------------------------------------------------------
  // 6. Run tempo — 11.2 km, 65 min, avg HR 159
  // -------------------------------------------------------------------------
  {
    id: 'activity-run-tempo-2026-06-09',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-run-tempo-2026-06-09',
    title: 'Tempo run progression',
    sport: 'running',
    activityType: 'tempo',
    startTime: '2026-06-09T06:20:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 3900,
    movingDurationSeconds: 3860,
    distanceMeters: 11200,
    elevationGainMeters: 72,
    averageHeartRateBpm: 159,
    maxHeartRateBpm: 177,
    averagePaceSecPerKm: 348,
    bestPaceSecPerKm: 252,
    averageCadence: 176,
    calories: 870,
    perceivedExertion: 7,
    laps: [
      runLap(1,  1000, 390, 140, 170),
      runLap(2,  1000, 375, 148, 173),
      runLap(3,  1000, 355, 155, 175),
      runLap(4,  1000, 340, 161, 177),
      runLap(5,  1000, 335, 163, 178),
      runLap(6,  1000, 332, 164, 178),
      runLap(7,  1000, 328, 165, 179),
      runLap(8,  1000, 330, 166, 179),
      runLap(9,  1000, 338, 168, 177),
      runLap(10, 1000, 355, 162, 175),
      runLap(11, 1000, 352, 155, 172),
      runLap(12,  200,  70, 150, 170),
    ],
    timeInHrZones: hrZones([195, 975, 1638, 936, 156]),
    timeSeries: makeRunTimeSeries(3900, 159, 348, 176, 72, true),
    createdAt: '2026-06-09T07:30:00.000Z',
    updatedAt: '2026-06-09T07:30:00.000Z',
  },

  // -------------------------------------------------------------------------
  // 7. Swim endurance — 2800 m, 55 min
  // -------------------------------------------------------------------------
  {
    id: 'activity-swim-endurance-2026-06-07',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-swim-endurance-2026-06-07',
    title: 'Aerobic swim endurance',
    sport: 'swimming',
    activityType: 'easy',
    startTime: '2026-06-07T08:15:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 3300,
    movingDurationSeconds: 2850,
    distanceMeters: 2800,
    averageHeartRateBpm: 132,
    maxHeartRateBpm: 155,
    averagePaceSecPerKm: 1179,
    calories: 510,
    perceivedExertion: 5,
    poolLengthMeters: 25,
    dominantStrokeType: 'freestyle',
    totalStrokeCount: 1624,
    avgSwolfScore: 41,
    swimLaps: swimEnduranceLaps,
    timeInHrZones: hrZones([825, 2145, 330, 0, 0]),
    timeSeries: makeSwimTimeSeries(swimEnduranceLaps, 2850, 132),
    createdAt: '2026-06-07T09:20:00.000Z',
    updatedAt: '2026-06-07T09:20:00.000Z',
  },

  // -------------------------------------------------------------------------
  // 8. Bike recovery — 21.8 km, 40 min, avg HR 112
  // -------------------------------------------------------------------------
  {
    id: 'activity-bike-recovery-2026-06-06',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-bike-recovery-2026-06-06',
    title: 'Recovery spin',
    sport: 'cycling',
    activityType: 'recovery',
    startTime: '2026-06-06T15:00:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 2400,
    movingDurationSeconds: 2400,
    distanceMeters: 21800,
    averageHeartRateBpm: 112,
    maxHeartRateBpm: 128,
    averagePowerWatts: 122,
    normalizedPowerWatts: 129,
    averageSpeedKmh: 32.7,
    calories: 430,
    perceivedExertion: 2,
    intensityFactor: 0.45,
    trainingStressScore: 14,
    laps: [
      bikeLap(1, 5000, 555, 108, 114, 81, 0),
      bikeLap(2, 5000, 548, 112, 122, 83, 0),
      bikeLap(3, 5000, 548, 113, 125, 84, 0),
      bikeLap(4, 5000, 550, 113, 124, 83, 0),
      bikeLap(5, 1800, 199, 111, 118, 82, 0),
    ],
    timeInHrZones: hrZones([2040, 336, 24, 0, 0]),
    timeSeries: makeCyclingTimeSeries(2400, 112, 122, 83, 0, false),
    createdAt: '2026-06-06T15:45:00.000Z',
    updatedAt: '2026-06-06T15:45:00.000Z',
  },

  // -------------------------------------------------------------------------
  // 9. Run long — 15.4 km, 90 min, avg HR 148
  // -------------------------------------------------------------------------
  {
    id: 'activity-run-long-2026-06-05',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-run-long-2026-06-05',
    title: 'Long steady run',
    sport: 'running',
    activityType: 'long',
    startTime: '2026-06-05T06:10:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 5400,
    movingDurationSeconds: 5350,
    distanceMeters: 15400,
    elevationGainMeters: 126,
    averageHeartRateBpm: 148,
    maxHeartRateBpm: 166,
    averagePaceSecPerKm: 351,
    bestPaceSecPerKm: 292,
    averageCadence: 173,
    calories: 1160,
    perceivedExertion: 6,
    laps: [
      runLap(1,  1000, 368, 135, 170),
      runLap(2,  1000, 356, 140, 172),
      runLap(3,  1000, 350, 144, 173),
      runLap(4,  1000, 347, 146, 173),
      runLap(5,  1000, 344, 148, 174),
      runLap(6,  1000, 342, 149, 174),
      runLap(7,  1000, 341, 150, 174),
      runLap(8,  1000, 343, 151, 174),
      runLap(9,  1000, 345, 151, 173),
      runLap(10, 1000, 347, 152, 173),
      runLap(11, 1000, 351, 153, 172),
      runLap(12, 1000, 354, 153, 172),
      runLap(13, 1000, 357, 152, 171),
      runLap(14, 1000, 360, 150, 170),
      runLap(15, 1000, 365, 148, 170),
      runLap(16,  400, 130, 145, 169),
    ],
    timeInHrZones: hrZones([270, 3132, 1782, 216, 0]),
    timeSeries: makeRunTimeSeries(5400, 148, 351, 173, 126, false),
    createdAt: '2026-06-05T07:45:00.000Z',
    updatedAt: '2026-06-05T07:45:00.000Z',
  },

  // -------------------------------------------------------------------------
  // 10. Mobility — 30 min (no HR zones, no time series)
  // -------------------------------------------------------------------------
  {
    id: 'activity-mobility-2026-06-04',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-mobility-2026-06-04',
    title: 'Mobility and breathing',
    sport: 'mobility',
    activityType: 'recovery',
    startTime: '2026-06-04T19:30:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 1800,
    perceivedExertion: 1,
    notes: 'Hip mobility, thoracic rotation and nasal breathing drills.',
    createdAt: '2026-06-04T20:05:00.000Z',
    updatedAt: '2026-06-04T20:05:00.000Z',
  },

  // -------------------------------------------------------------------------
  // 11. Bike VO2 — 36.1 km, 70 min, avg HR 154, avg pwr 226 W, NP 269 W
  // -------------------------------------------------------------------------
  {
    id: 'activity-bike-vo2-2026-06-03',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-bike-vo2-2026-06-03',
    title: 'VO2 max bike repeats',
    sport: 'cycling',
    activityType: 'vo2max',
    startTime: '2026-06-03T17:30:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 4200,
    movingDurationSeconds: 4140,
    distanceMeters: 36100,
    elevationGainMeters: 180,
    averageHeartRateBpm: 154,
    maxHeartRateBpm: 187,
    averagePowerWatts: 226,
    maxPowerWatts: 544,
    normalizedPowerWatts: 269,
    averageSpeedKmh: 31.4,
    averageCadence: 93,
    calories: 990,
    perceivedExertion: 9,
    intensityFactor: 0.94,
    trainingStressScore: 104,
    laps: [
      bikeLap(1, 5000, 598, 136, 185, 89, 22),
      bikeLap(2, 5000, 565, 148, 238, 93, 18),
      bikeLap(3, 5000, 545, 163, 318, 97, 42),
      bikeLap(4, 5000, 580, 152, 210, 90, 30),
      bikeLap(5, 5000, 538, 166, 325, 97, 28),
      bikeLap(6, 5000, 568, 158, 218, 91, 20),
      bikeLap(7, 5000, 530, 170, 330, 98, 20),
      bikeLap(8, 1100, 216, 143, 182, 87, 0),
    ],
    timeInHrZones: hrZones([210, 924, 1176, 1050, 840]),
    timeSeries: makeCyclingTimeSeries(4200, 154, 226, 93, 180, true),
    createdAt: '2026-06-03T18:45:00.000Z',
    updatedAt: '2026-06-03T18:45:00.000Z',
  },

  // -------------------------------------------------------------------------
  // 12. Run recovery — 5.7 km, 35 min, avg HR 129
  // -------------------------------------------------------------------------
  {
    id: 'activity-run-recovery-2026-06-02',
    athleteProfileId: prototypeAthleteProfile.id,
    sourceType: 'mock',
    externalId: 'mock-run-recovery-2026-06-02',
    title: 'Short recovery jog',
    sport: 'running',
    activityType: 'recovery',
    startTime: '2026-06-02T06:45:00.000Z',
    timezone: 'Europe/Berlin',
    durationSeconds: 2100,
    movingDurationSeconds: 2080,
    distanceMeters: 5700,
    averageHeartRateBpm: 129,
    maxHeartRateBpm: 145,
    averagePaceSecPerKm: 365,
    averageCadence: 168,
    calories: 390,
    perceivedExertion: 3,
    laps: [
      runLap(1, 1000, 380, 124, 167),
      runLap(2, 1000, 372, 128, 168),
      runLap(3, 1000, 368, 130, 169),
      runLap(4, 1000, 365, 131, 169),
      runLap(5, 1000, 370, 130, 168),
      runLap(6,  700, 245, 128, 167),
    ],
    timeInHrZones: hrZones([378, 1575, 147, 0, 0]),
    timeSeries: makeRunTimeSeries(2100, 129, 365, 168, 0, false),
    createdAt: '2026-06-02T07:25:00.000Z',
    updatedAt: '2026-06-02T07:25:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Training plan, planned workouts, workout steps
// ---------------------------------------------------------------------------

export const prototypeTrainingPlan: TrainingPlan = {
  id: 'plan-week-2026-06-15',
  athleteProfileId: prototypeAthleteProfile.id,
  title: 'Build Week 3',
  description: 'Balanced triathlon build week with one bike intensity session, one tempo run and two swim touches.',
  startDate: '2026-06-15',
  endDate: '2026-06-21',
  status: 'active',
  source: 'ai_generated',
  goalId: 'goal-olympic-triathlon',
  aiCoachOutputId: 'ai-output-week-plan-2026-06-15',
  createdAt: '2026-06-15T07:50:00.000Z',
  updatedAt: now,
};

export const prototypePlannedWorkouts: PlannedWorkout[] = [
  {
    id: 'workout-swim-technique-2026-06-15',
    trainingPlanId: prototypeTrainingPlan.id,
    athleteProfileId: prototypeAthleteProfile.id,
    title: 'Swim technique and relaxed aerobic volume',
    sport: 'swimming',
    workoutType: 'technique',
    scheduledDate: '2026-06-15',
    scheduledStartTime: '2026-06-15T17:30:00.000Z',
    plannedDurationSeconds: 2700,
    plannedDistanceMeters: 2200,
    intensity: 'easy',
    status: 'planned',
    objective: 'Improve catch mechanics without adding fatigue.',
    description: 'Technique-focused swim with relaxed aerobic 200s and short drill blocks.',
    coachNotes: 'Keep the session smooth. Stop the main set if stroke quality drops.',
    source: 'ai_generated',
    aiCoachOutputId: 'ai-output-week-plan-2026-06-15',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'workout-bike-threshold-2026-06-16',
    trainingPlanId: prototypeTrainingPlan.id,
    athleteProfileId: prototypeAthleteProfile.id,
    title: 'Bike threshold over-unders',
    sport: 'cycling',
    workoutType: 'threshold',
    scheduledDate: '2026-06-16',
    scheduledStartTime: '2026-06-16T17:45:00.000Z',
    plannedDurationSeconds: 4500,
    plannedDistanceMeters: 38000,
    intensity: 'threshold',
    status: 'planned',
    objective: 'Build sustained bike power around threshold.',
    description: 'Controlled over-under intervals around FTP with full aerobic warm-up.',
    coachNotes: 'Target smooth power. Avoid sprinting the over sections early.',
    source: 'ai_generated',
    aiCoachOutputId: 'ai-output-week-plan-2026-06-15',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'workout-run-easy-strides-2026-06-17',
    trainingPlanId: prototypeTrainingPlan.id,
    athleteProfileId: prototypeAthleteProfile.id,
    title: 'Easy run with strides',
    sport: 'running',
    workoutType: 'endurance',
    scheduledDate: '2026-06-17',
    scheduledStartTime: '2026-06-17T06:45:00.000Z',
    plannedDurationSeconds: 3000,
    plannedDistanceMeters: 8500,
    intensity: 'easy',
    status: 'planned',
    objective: 'Maintain run frequency and add light neuromuscular stimulus.',
    description: 'Easy aerobic run finished with short relaxed strides.',
    source: 'ai_generated',
    aiCoachOutputId: 'ai-output-week-plan-2026-06-15',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'workout-strength-maintenance-2026-06-18',
    trainingPlanId: prototypeTrainingPlan.id,
    athleteProfileId: prototypeAthleteProfile.id,
    title: 'Strength maintenance',
    sport: 'strength',
    workoutType: 'strength',
    scheduledDate: '2026-06-18',
    scheduledStartTime: '2026-06-18T18:15:00.000Z',
    plannedDurationSeconds: 2400,
    intensity: 'strength',
    status: 'planned',
    objective: 'Maintain basic strength without compromising weekend volume.',
    description: 'Short full-body maintenance session with controlled effort.',
    source: 'manual',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'workout-run-tempo-2026-06-19',
    trainingPlanId: prototypeTrainingPlan.id,
    athleteProfileId: prototypeAthleteProfile.id,
    title: 'Tempo run progression',
    sport: 'running',
    workoutType: 'tempo',
    scheduledDate: '2026-06-19',
    scheduledStartTime: '2026-06-19T06:30:00.000Z',
    plannedDurationSeconds: 4200,
    plannedDistanceMeters: 12000,
    intensity: 'tempo',
    status: 'planned',
    objective: 'Improve controlled race-adjacent run durability.',
    description: 'Progressive tempo session capped below threshold.',
    coachNotes: 'Start conservative and keep the last tempo block controlled.',
    source: 'ai_generated',
    aiCoachOutputId: 'ai-output-week-plan-2026-06-15',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'workout-swim-aerobic-2026-06-20',
    trainingPlanId: prototypeTrainingPlan.id,
    athleteProfileId: prototypeAthleteProfile.id,
    title: 'Aerobic swim endurance',
    sport: 'swimming',
    workoutType: 'endurance',
    scheduledDate: '2026-06-20',
    scheduledStartTime: '2026-06-20T09:00:00.000Z',
    plannedDurationSeconds: 3300,
    plannedDistanceMeters: 2800,
    intensity: 'moderate',
    status: 'planned',
    objective: 'Extend relaxed swim volume with steady pacing.',
    description: 'Aerobic main set with short rest and consistent form.',
    source: 'ai_generated',
    aiCoachOutputId: 'ai-output-week-plan-2026-06-15',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'workout-bike-long-2026-06-21',
    trainingPlanId: prototypeTrainingPlan.id,
    athleteProfileId: prototypeAthleteProfile.id,
    title: 'Long endurance ride',
    sport: 'cycling',
    workoutType: 'long',
    scheduledDate: '2026-06-21',
    scheduledStartTime: '2026-06-21T07:30:00.000Z',
    plannedDurationSeconds: 9000,
    plannedDistanceMeters: 76000,
    intensity: 'easy',
    status: 'planned',
    objective: 'Build aerobic volume and bike durability.',
    description: 'Mostly Zone 2 ride with steady fueling practice.',
    coachNotes: 'Keep the ride easy enough to finish fresh.',
    source: 'ai_generated',
    aiCoachOutputId: 'ai-output-week-plan-2026-06-15',
    createdAt: now,
    updatedAt: now,
  },
];

export const prototypeWorkoutSteps: WorkoutStep[] = [
  { id: 'step-swim-technique-1', plannedWorkoutId: 'workout-swim-technique-2026-06-15', stepIndex: 1, stepType: 'warmup', title: 'Warm-up', instruction: 'Easy freestyle with relaxed breathing.', distanceMeters: 400 },
  { id: 'step-swim-technique-2', plannedWorkoutId: 'workout-swim-technique-2026-06-15', stepIndex: 2, stepType: 'technique', title: 'Drill block', instruction: '8 x 50m catch drill, alternating drill and swim.', distanceMeters: 400, repetitions: 8, restSeconds: 20 },
  { id: 'step-swim-technique-3', plannedWorkoutId: 'workout-swim-technique-2026-06-15', stepIndex: 3, stepType: 'main', title: 'Aerobic 200s', instruction: '5 x 200m steady aerobic freestyle.', distanceMeters: 1000, targetSwimPaceLowerSecPer100m: 112, targetSwimPaceUpperSecPer100m: 122, restSeconds: 30 },
  { id: 'step-swim-technique-4', plannedWorkoutId: 'workout-swim-technique-2026-06-15', stepIndex: 4, stepType: 'cooldown', title: 'Cool-down', instruction: 'Easy mixed stroke cool-down.', distanceMeters: 400 },
  { id: 'step-bike-threshold-1', plannedWorkoutId: 'workout-bike-threshold-2026-06-16', stepIndex: 1, stepType: 'warmup', title: 'Progressive warm-up', instruction: 'Easy spin, then 3 x 30s high cadence.', durationSeconds: 900, targetPowerLowerWatts: 120, targetPowerUpperWatts: 210 },
  { id: 'step-bike-threshold-2', plannedWorkoutId: 'workout-bike-threshold-2026-06-16', stepIndex: 2, stepType: 'interval', title: 'Over-under set', instruction: '3 x 10min alternating 2min at 95% FTP and 1min at 105% FTP.', durationSeconds: 1800, repetitions: 3, targetPowerLowerWatts: 271, targetPowerUpperWatts: 299, restSeconds: 300 },
  { id: 'step-bike-threshold-3', plannedWorkoutId: 'workout-bike-threshold-2026-06-16', stepIndex: 3, stepType: 'cooldown', title: 'Cool-down', instruction: 'Easy spin and bring heart rate down.', durationSeconds: 900, targetPowerLowerWatts: 100, targetPowerUpperWatts: 160 },
  { id: 'step-run-easy-1', plannedWorkoutId: 'workout-run-easy-strides-2026-06-17', stepIndex: 1, stepType: 'main', title: 'Easy aerobic run', instruction: 'Run easy in Zone 2.', durationSeconds: 2400, targetPaceLowerSecPerKm: 330, targetPaceUpperSecPerKm: 390 },
  { id: 'step-run-easy-2', plannedWorkoutId: 'workout-run-easy-strides-2026-06-17', stepIndex: 2, stepType: 'interval', title: 'Strides', instruction: '6 x 20s relaxed strides with full walk-back recovery.', repetitions: 6, durationSeconds: 20, restSeconds: 80 },
  { id: 'step-strength-1', plannedWorkoutId: 'workout-strength-maintenance-2026-06-18', stepIndex: 1, stepType: 'strength_exercise', title: 'Lower body circuit', instruction: '3 rounds of goblet squat, Romanian deadlift and split squat at controlled effort.', repetitions: 3, restSeconds: 90 },
  { id: 'step-run-tempo-1', plannedWorkoutId: 'workout-run-tempo-2026-06-19', stepIndex: 1, stepType: 'warmup', title: 'Warm-up', instruction: 'Easy jog with 4 relaxed accelerations.', durationSeconds: 900 },
  { id: 'step-run-tempo-2', plannedWorkoutId: 'workout-run-tempo-2026-06-19', stepIndex: 2, stepType: 'main', title: 'Tempo progression', instruction: '3 x 10min tempo, each block slightly faster than the last.', durationSeconds: 1800, targetPaceLowerSecPerKm: 270, targetPaceUpperSecPerKm: 300, restSeconds: 180 },
  { id: 'step-run-tempo-3', plannedWorkoutId: 'workout-run-tempo-2026-06-19', stepIndex: 3, stepType: 'cooldown', title: 'Cool-down', instruction: 'Easy jog home.', durationSeconds: 900 },
  { id: 'step-swim-aerobic-1', plannedWorkoutId: 'workout-swim-aerobic-2026-06-20', stepIndex: 1, stepType: 'warmup', title: 'Warm-up', instruction: 'Easy swim and drills.', distanceMeters: 500 },
  { id: 'step-swim-aerobic-2', plannedWorkoutId: 'workout-swim-aerobic-2026-06-20', stepIndex: 2, stepType: 'main', title: 'Steady 400s', instruction: '5 x 400m steady aerobic pace.', distanceMeters: 2000, targetSwimPaceLowerSecPer100m: 108, targetSwimPaceUpperSecPer100m: 118, restSeconds: 40 },
  { id: 'step-swim-aerobic-3', plannedWorkoutId: 'workout-swim-aerobic-2026-06-20', stepIndex: 3, stepType: 'cooldown', title: 'Cool-down', instruction: 'Easy cool-down.', distanceMeters: 300 },
  { id: 'step-bike-long-1', plannedWorkoutId: 'workout-bike-long-2026-06-21', stepIndex: 1, stepType: 'main', title: 'Endurance ride', instruction: 'Ride mostly Zone 2. Practice fueling every 25 minutes.', durationSeconds: 8400, targetPowerLowerWatts: 158, targetPowerUpperWatts: 213 },
  { id: 'step-bike-long-2', plannedWorkoutId: 'workout-bike-long-2026-06-21', stepIndex: 2, stepType: 'cooldown', title: 'Easy spin', instruction: 'Finish with 10 minutes very easy.', durationSeconds: 600 },
];

// ---------------------------------------------------------------------------
// Weekly summary
// ---------------------------------------------------------------------------

export const prototypeWeeklySummary: WeeklySummary = {
  id: 'weekly-summary-2026-06-15',
  athleteProfileId: prototypeAthleteProfile.id,
  weekStartDate: '2026-06-15',
  weekEndDate: '2026-06-21',
  totalDurationSeconds: 30660,
  totalDistanceMeters: 162200,
  cyclingDurationSeconds: 15300,
  runningDurationSeconds: 6900,
  swimmingDurationSeconds: 6000,
  strengthDurationSeconds: 2400,
  activityCount: 7,
  plannedDurationSeconds: 30660,
  completedPlannedDurationSeconds: 0,
  easyDurationSeconds: 17400,
  moderateDurationSeconds: 7200,
  hardDurationSeconds: 3660,
  createdAt: now,
  updatedAt: now,
};

// ---------------------------------------------------------------------------
// AI coach preview
// ---------------------------------------------------------------------------

export const prototypeAiCoachPreview: AiCoachPreview = {
  id: 'ai-output-week-plan-2026-06-15',
  athleteProfileId: prototypeAthleteProfile.id,
  outputType: 'week_plan',
  status: 'draft',
  summary: 'This week keeps volume steady while placing quality on the bike and run. Swim work is technical and aerobic to support consistency without excess fatigue.',
  rawText: 'Prioritize bike threshold quality on Tuesday, keep Wednesday easy, and cap Friday tempo below threshold. If fatigue rises, replace Thursday strength with mobility.',
  validationStatus: 'valid',
  createdTrainingPlanId: prototypeTrainingPlan.id,
  createdAt: '2026-06-15T07:50:00.000Z',
};

// ---------------------------------------------------------------------------
// Performance stats (VO2 max, thresholds, race predictions)
// ---------------------------------------------------------------------------

const racePredictions: RacePrediction[] = [
  { sport: 'running', distanceLabel: '5K',          distanceMeters:  5000, predictedDurationSeconds: 1245, predictedPaceSecPerKm: 249, estimatedAt: '2026-06-09T07:30:00.000Z' },
  { sport: 'running', distanceLabel: '10K',         distanceMeters: 10000, predictedDurationSeconds: 2580, predictedPaceSecPerKm: 258, estimatedAt: '2026-06-09T07:30:00.000Z' },
  { sport: 'running', distanceLabel: 'Half Marathon', distanceMeters: 21097, predictedDurationSeconds: 5520, predictedPaceSecPerKm: 262, estimatedAt: '2026-06-09T07:30:00.000Z' },
  { sport: 'running', distanceLabel: 'Marathon',    distanceMeters: 42195, predictedDurationSeconds: 11820, predictedPaceSecPerKm: 280, estimatedAt: '2026-06-09T07:30:00.000Z' },
  { sport: 'cycling', distanceLabel: '40km TT',     distanceMeters: 40000, predictedDurationSeconds: 4020, predictedSpeedKmh: 35.8, estimatedAt: '2026-06-11T18:35:00.000Z' },
  { sport: 'swimming', distanceLabel: '400m',       distanceMeters:   400, predictedDurationSeconds:  438, estimatedAt: '2026-06-07T09:20:00.000Z' },
  { sport: 'swimming', distanceLabel: '1500m',      distanceMeters:  1500, predictedDurationSeconds: 1710, estimatedAt: '2026-06-07T09:20:00.000Z' },
];

export const prototypePerformanceStats: PerformanceStats = {
  athleteProfileId: prototypeAthleteProfile.id,
  bySport: {
    running: {
      vo2maxEstimate: 54.2,
      vo2maxEstimatedAt: '2026-06-03T18:45:00.000Z',
      thresholdHeartRateBpm: 169,
      thresholdHeartRateEstimatedAt: '2026-06-09T07:30:00.000Z',
      thresholdPaceSecPerKm: 258,
      thresholdPaceEstimatedAt: '2026-06-09T07:30:00.000Z',
    },
    cycling: {
      vo2maxEstimate: 52.8,
      vo2maxEstimatedAt: '2026-05-28T09:00:00.000Z',
      thresholdHeartRateBpm: 161,
      thresholdHeartRateEstimatedAt: '2026-05-28T09:00:00.000Z',
      ftpWatts: 285,
      ftpEstimatedAt: '2026-05-28T09:00:00.000Z',
    },
    swimming: {
      thresholdHeartRateBpm: 158,
      thresholdHeartRateEstimatedAt: '2026-06-07T09:20:00.000Z',
      thresholdPaceSecPer100m: 105,
      thresholdPaceEstimatedAt: '2026-06-07T09:20:00.000Z',
    },
  },
  racePredictions,
  updatedAt: now,
};
