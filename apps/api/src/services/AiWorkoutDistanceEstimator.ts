import type {
  AiGeneratedSingleWorkout,
  AiGeneratedWeekPlan,
  AiGeneratedWorkout,
  AiGeneratedWorkoutStep,
} from '@pp-trainer/shared';

import type { ZoneSetWithZones } from '../repositories/AthleteRepository.js';

type Zone = ZoneSetWithZones['zones'][number];

function getBoundAverage(lower: number | null, upper: number | null): number | undefined {
  if (lower != null && upper != null) return Math.round((lower + upper) / 2);
  return lower ?? upper ?? undefined;
}

function getStepZoneNumber(step: AiGeneratedWorkoutStep, workout: AiGeneratedWorkout): number | undefined {
  const zoneText = step.targetPaceZoneName ?? step.targetHeartRateZoneName;
  const parsedZone = zoneText?.match(/\b(?:zone\s*)?([1-6])\b/i)?.[1];
  if (parsedZone != null) return Number(parsedZone);

  if (step.stepType === 'warmup' || step.stepType === 'cooldown' || workout.intensity === 'recovery') {
    return 1;
  }
  if (workout.intensity === 'tempo') return 3;
  if (workout.intensity === 'threshold') return 4;
  if (workout.intensity === 'vo2max') return 5;
  return 2;
}

function normalizeZoneName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findPaceZone(
  zoneSets: ZoneSetWithZones[],
  workout: AiGeneratedWorkout,
  step: AiGeneratedWorkoutStep,
): Zone | undefined {
  const expectedZoneType = workout.sport === 'swimming' ? 'SwimmingPace' : 'RunningPace';
  const paceSet = zoneSets.find((set) => set.zoneType === expectedZoneType && set.isActive);
  if (paceSet == null) return undefined;

  if (step.targetPaceZoneName != null) {
    const targetName = normalizeZoneName(step.targetPaceZoneName);
    const namedZone = paceSet.zones.find((zone) => {
      const zoneName = normalizeZoneName(zone.name);
      return zoneName === targetName || zoneName.includes(targetName) || targetName.includes(zoneName);
    });
    if (namedZone != null) return namedZone;
  }

  const zoneNumber = getStepZoneNumber(step, workout);
  return zoneNumber != null
    ? paceSet.zones.find((zone) => zone.zoneNumber === zoneNumber)
    : undefined;
}

function estimateDistanceMeters(durationSeconds: number, paceSeconds: number, sport: string): number | undefined {
  if (durationSeconds <= 0 || paceSeconds <= 0) return undefined;
  const distanceUnitMeters = sport === 'swimming' ? 100 : 1000;
  return Math.round((durationSeconds / paceSeconds) * distanceUnitMeters);
}

function enrichWorkoutStepDistance(
  workout: AiGeneratedWorkout,
  step: AiGeneratedWorkoutStep,
  zoneSets: ZoneSetWithZones[],
): AiGeneratedWorkoutStep {
  if (step.distanceMeters != null || step.durationSeconds == null) return step;
  if (workout.sport !== 'running' && workout.sport !== 'swimming') return step;

  const paceZone = findPaceZone(zoneSets, workout, step);
  const lowerPace = workout.sport === 'swimming'
    ? step.targetSwimPaceLowerSecPer100m ?? paceZone?.lowerBound ?? undefined
    : step.targetPaceLowerSecPerKm ?? paceZone?.lowerBound ?? undefined;
  const upperPace = workout.sport === 'swimming'
    ? step.targetSwimPaceUpperSecPer100m ?? paceZone?.upperBound ?? undefined
    : step.targetPaceUpperSecPerKm ?? paceZone?.upperBound ?? undefined;
  const averagePace = getBoundAverage(lowerPace ?? null, upperPace ?? null);
  const distanceMeters = averagePace != null
    ? estimateDistanceMeters(step.durationSeconds, averagePace, workout.sport)
    : undefined;

  if (distanceMeters == null) return step;

  return {
    ...step,
    distanceMeters,
    ...(paceZone != null && step.targetPaceZoneName == null && { targetPaceZoneName: paceZone.name }),
    ...(workout.sport === 'running' && lowerPace != null && { targetPaceLowerSecPerKm: lowerPace }),
    ...(workout.sport === 'running' && upperPace != null && { targetPaceUpperSecPerKm: upperPace }),
    ...(workout.sport === 'swimming' && lowerPace != null && { targetSwimPaceLowerSecPer100m: lowerPace }),
    ...(workout.sport === 'swimming' && upperPace != null && { targetSwimPaceUpperSecPer100m: upperPace }),
  };
}

export function enrichWorkoutDistances(
  workout: AiGeneratedWorkout,
  zoneSets: ZoneSetWithZones[],
): AiGeneratedWorkout {
  const steps = workout.steps.map((step) => enrichWorkoutStepDistance(workout, step, zoneSets));
  const stepDistanceMeters = steps.reduce(
    (sum, step) => sum + (step.distanceMeters ?? 0) * (step.repetitions ?? 1),
    0,
  );

  return {
    ...workout,
    steps,
    ...(workout.plannedDistanceMeters == null && stepDistanceMeters > 0 && {
      plannedDistanceMeters: stepDistanceMeters,
    }),
  };
}

export function enrichWeekPlanDistances(
  plan: AiGeneratedWeekPlan,
  zoneSets: ZoneSetWithZones[],
): AiGeneratedWeekPlan {
  return {
    ...plan,
    workouts: plan.workouts.map((workout) => enrichWorkoutDistances(workout, zoneSets)),
  };
}

export function enrichSingleWorkoutDistances(
  singleWorkout: AiGeneratedSingleWorkout,
  zoneSets: ZoneSetWithZones[],
): AiGeneratedSingleWorkout {
  return {
    ...singleWorkout,
    workout: enrichWorkoutDistances(singleWorkout.workout, zoneSets),
  };
}
