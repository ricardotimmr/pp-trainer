import {
  buildDefaultSeedPayload,
  buildNoActivePlanSeedPayload,
  countSeedPayloadRecords,
} from './mappers';

type ValidationError = string;

function validateDefaultPayload(): ValidationError[] {
  const errors: ValidationError[] = [];
  const payload = buildDefaultSeedPayload();

  if (payload.athleteProfiles.length !== 1) {
    errors.push(`Expected 1 athlete profile, got ${payload.athleteProfiles.length}`);
  }

  const athleteId = payload.athleteProfiles[0]?.id;
  if (!athleteId) {
    errors.push('Athlete profile is missing an id');
    return errors;
  }

  if (payload.activities.length === 0) {
    errors.push('Default seed has no activities');
  }

  if (payload.trainingGoals.length === 0) {
    errors.push('Default seed has no training goals');
  }

  if (payload.trainingZoneSets.length === 0) {
    errors.push('Default seed has no training zone sets');
  }

  const activityIds = new Set(payload.activities.map((a) => a.id as string));

  const orphanedLaps = payload.activityLaps.filter(
    (lap) => !activityIds.has(lap.activityId as string),
  );
  if (orphanedLaps.length > 0) {
    errors.push(`${orphanedLaps.length} activity lap(s) reference unknown activityId`);
  }

  const orphanedSwimLaps = payload.activitySwimLaps.filter(
    (lap) => !activityIds.has(lap.activityId as string),
  );
  if (orphanedSwimLaps.length > 0) {
    errors.push(`${orphanedSwimLaps.length} swim lap(s) reference unknown activityId`);
  }

  const orphanedSamples = payload.activityMetricSamples.filter(
    (s) => !activityIds.has(s.activityId as string),
  );
  if (orphanedSamples.length > 0) {
    errors.push(`${orphanedSamples.length} metric sample(s) reference unknown activityId`);
  }

  const orphanedZones = payload.activityTimeInZones.filter(
    (z) => !activityIds.has(z.activityId as string),
  );
  if (orphanedZones.length > 0) {
    errors.push(`${orphanedZones.length} time-in-zone record(s) reference unknown activityId`);
  }

  const orphanedStrengthSets = payload.activityStrengthSets.filter(
    (s) => !activityIds.has(s.activityId as string),
  );
  if (orphanedStrengthSets.length > 0) {
    errors.push(`${orphanedStrengthSets.length} strength set(s) reference unknown activityId`);
  }

  const orphanedStrengthExercises = payload.activityStrengthExercises.filter(
    (e) => !activityIds.has(e.activityId as string),
  );
  if (orphanedStrengthExercises.length > 0) {
    errors.push(`${orphanedStrengthExercises.length} strength exercise(s) reference unknown activityId`);
  }

  const zoneSetIds = new Set(payload.trainingZoneSets.map((s) => s.id as string));
  const orphanedZoneDefinitions = payload.trainingZones.filter(
    (z) => !zoneSetIds.has(z.trainingZoneSetId as string),
  );
  if (orphanedZoneDefinitions.length > 0) {
    errors.push(`${orphanedZoneDefinitions.length} training zone(s) reference unknown zoneSetId`);
  }

  const planIds = new Set(payload.trainingPlans.map((p) => p.id as string));
  const orphanedWorkouts = payload.plannedWorkouts.filter(
    (w) => w.trainingPlanId != null && !planIds.has(w.trainingPlanId as string),
  );
  if (orphanedWorkouts.length > 0) {
    errors.push(`${orphanedWorkouts.length} planned workout(s) reference unknown trainingPlanId`);
  }

  const workoutIds = new Set(payload.plannedWorkouts.map((w) => w.id as string));
  const orphanedSteps = payload.workoutSteps.filter(
    (s) => !workoutIds.has(s.plannedWorkoutId as string),
  );
  if (orphanedSteps.length > 0) {
    errors.push(`${orphanedSteps.length} workout step(s) reference unknown plannedWorkoutId`);
  }

  const total = countSeedPayloadRecords(payload);
  if (total === 0) {
    errors.push('Seed payload has zero total records');
  }

  return errors;
}

function validateNoActivePlanPayload(): ValidationError[] {
  const errors: ValidationError[] = [];
  const payload = buildNoActivePlanSeedPayload();

  if (payload.trainingPlans.length !== 0) {
    errors.push(`no-active-plan scenario should have 0 training plans, got ${payload.trainingPlans.length}`);
  }

  if (payload.plannedWorkouts.length !== 0) {
    errors.push(`no-active-plan scenario should have 0 planned workouts, got ${payload.plannedWorkouts.length}`);
  }

  if (payload.workoutSteps.length !== 0) {
    errors.push(`no-active-plan scenario should have 0 workout steps, got ${payload.workoutSteps.length}`);
  }

  if (payload.activities.length === 0) {
    errors.push('no-active-plan scenario should still have activities');
  }

  return errors;
}

function main() {
  console.log('Validating seed payloads...');

  const defaultErrors = validateDefaultPayload();
  const noActivePlanErrors = validateNoActivePlanPayload();
  const allErrors = [
    ...defaultErrors.map((e) => `[default] ${e}`),
    ...noActivePlanErrors.map((e) => `[no-active-plan] ${e}`),
  ];

  if (allErrors.length > 0) {
    console.error('Seed validation FAILED:');
    allErrors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exitCode = 1;
  } else {
    console.log('Seed validation passed.');
  }
}

main();
