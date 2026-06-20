import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import {
  buildDefaultSeedPayload,
  buildNoActivePlanSeedPayload,
  countSeedPayloadRecords,
  type SeedPayload,
} from './seed/mappers';

const seedScenarios = ['default', 'no-active-plan'] as const;

type SeedScenario = (typeof seedScenarios)[number];

const appTables = [
  'AiCoachOutput',
  'AthleteContextSnapshot',
  'WorkoutStep',
  'PlannedWorkout',
  'TrainingPlan',
  'RacePrediction',
  'PerformanceSportMetric',
  'RawActivityData',
  'ImportedFile',
  'ActivityStrengthExercise',
  'ActivityStrengthSet',
  'ActivityTimeInZone',
  'ActivityMetricSample',
  'ActivitySwimLap',
  'ActivityLap',
  'Activity',
  'TrainingZone',
  'TrainingZoneSet',
  'TrainingAvailability',
  'TrainingGoal',
  'AthleteProfile',
] as const;

type SeedSummary = {
  scenario: string;
  resetTables: number;
  mappedRecords: number;
  insertedRecords: number;
  updatedRecords: number;
};

function loadLocalEnv() {
  const envFilePath = resolve(process.cwd(), '.env');

  if (existsSync(envFilePath)) {
    loadEnvFile(envFilePath);
  }
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run the database seed.');
  }

  const adapter = new PrismaPg(databaseUrl);

  return new PrismaClient({ adapter });
}

function quoteTableName(tableName: string) {
  return `"${tableName.replaceAll('"', '""')}"`;
}

async function resetSeedData(prisma: PrismaClient) {
  const tableList = appTables.map(quoteTableName).join(', ');

  // Local development seed reset only. This intentionally clears app data while
  // keeping migrations and PostgreSQL enum definitions intact.
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`,
  );
}

function printSeedSummary(summary: SeedSummary) {
  console.log('Seed summary');
  console.log(`- Scenario: ${summary.scenario}`);
  console.log(`- Reset tables: ${summary.resetTables}`);
  console.log(`- Mapped records: ${summary.mappedRecords}`);
  console.log(`- Inserted records: ${summary.insertedRecords}`);
  console.log(`- Updated records: ${summary.updatedRecords}`);
}

function parseSeedScenario(): SeedScenario {
  const rawScenario = process.env.PP_SEED_SCENARIO ?? 'default';

  if (seedScenarios.includes(rawScenario as SeedScenario)) {
    return rawScenario as SeedScenario;
  }

  throw new Error(
    `Unsupported PP_SEED_SCENARIO value "${rawScenario}". Supported values: ${seedScenarios.join(
      ', ',
    )}.`,
  );
}

function buildSeedPayload(seedScenario: SeedScenario) {
  if (seedScenario === 'no-active-plan') {
    return buildNoActivePlanSeedPayload();
  }

  return buildDefaultSeedPayload();
}

async function insertDefaultSeed(
  prisma: PrismaClient,
  seedPayload: SeedPayload,
) {
  let insertedRecords = 0;
  let updatedRecords = 0;

  insertedRecords += (
    await prisma.athleteProfile.createMany({
      data: seedPayload.athleteProfiles,
    })
  ).count;
  insertedRecords += (
    await prisma.trainingGoal.createMany({
      data: seedPayload.trainingGoals,
    })
  ).count;
  insertedRecords += (
    await prisma.trainingAvailability.createMany({
      data: seedPayload.trainingAvailability,
    })
  ).count;
  insertedRecords += (
    await prisma.trainingZoneSet.createMany({
      data: seedPayload.trainingZoneSets,
    })
  ).count;
  insertedRecords += (
    await prisma.trainingZone.createMany({
      data: seedPayload.trainingZones,
    })
  ).count;

  insertedRecords += (
    await prisma.importedFile.createMany({
      data: seedPayload.importedFiles,
    })
  ).count;
  insertedRecords += (
    await prisma.rawActivityData.createMany({
      data: seedPayload.rawActivityData,
    })
  ).count;

  insertedRecords += (
    await prisma.activity.createMany({
      data: seedPayload.activities,
    })
  ).count;
  insertedRecords += (
    await prisma.activityLap.createMany({
      data: seedPayload.activityLaps,
    })
  ).count;
  insertedRecords += (
    await prisma.activitySwimLap.createMany({
      data: seedPayload.activitySwimLaps,
    })
  ).count;
  insertedRecords += (
    await prisma.activityMetricSample.createMany({
      data: seedPayload.activityMetricSamples,
    })
  ).count;
  insertedRecords += (
    await prisma.activityTimeInZone.createMany({
      data: seedPayload.activityTimeInZones,
    })
  ).count;
  insertedRecords += (
    await prisma.activityStrengthSet.createMany({
      data: seedPayload.activityStrengthSets,
    })
  ).count;
  insertedRecords += (
    await prisma.activityStrengthExercise.createMany({
      data: seedPayload.activityStrengthExercises,
    })
  ).count;

  insertedRecords += (
    await prisma.performanceSportMetric.createMany({
      data: seedPayload.performanceSportMetrics,
    })
  ).count;
  insertedRecords += (
    await prisma.racePrediction.createMany({
      data: seedPayload.racePredictions,
    })
  ).count;

  insertedRecords += (
    await prisma.athleteContextSnapshot.createMany({
      data: seedPayload.athleteContextSnapshots,
    })
  ).count;

  const aiCoachOutputsWithoutCreatedRefs = seedPayload.aiCoachOutputs.map(
    ({ createdTrainingPlanId, createdPlannedWorkoutId, ...aiCoachOutput }) =>
      aiCoachOutput,
  );

  insertedRecords += (
    await prisma.aiCoachOutput.createMany({
      data: aiCoachOutputsWithoutCreatedRefs,
    })
  ).count;

  insertedRecords += (
    await prisma.trainingPlan.createMany({
      data: seedPayload.trainingPlans,
    })
  ).count;
  insertedRecords += (
    await prisma.plannedWorkout.createMany({
      data: seedPayload.plannedWorkouts,
    })
  ).count;
  insertedRecords += (
    await prisma.workoutStep.createMany({
      data: seedPayload.workoutSteps,
    })
  ).count;

  for (const aiCoachOutput of seedPayload.aiCoachOutputs) {
    const createdTrainingPlanId =
      typeof aiCoachOutput.createdTrainingPlanId === 'string'
        ? aiCoachOutput.createdTrainingPlanId
        : undefined;
    const createdPlannedWorkoutId =
      typeof aiCoachOutput.createdPlannedWorkoutId === 'string'
        ? aiCoachOutput.createdPlannedWorkoutId
        : undefined;

    if (!createdTrainingPlanId && !createdPlannedWorkoutId) {
      continue;
    }

    await prisma.aiCoachOutput.update({
      where: { id: aiCoachOutput.id },
      data: {
        createdTrainingPlanId,
        createdPlannedWorkoutId,
      },
    });

    updatedRecords += 1;
  }

  return { insertedRecords, updatedRecords };
}

async function main() {
  loadLocalEnv();

  const prisma = createPrismaClient();
  const scenario = parseSeedScenario();

  try {
    const seedPayload = buildSeedPayload(scenario);

    await resetSeedData(prisma);
    const seedResult = await insertDefaultSeed(prisma, seedPayload);

    printSeedSummary({
      scenario,
      resetTables: appTables.length,
      mappedRecords: countSeedPayloadRecords(seedPayload),
      insertedRecords: seedResult.insertedRecords,
      updatedRecords: seedResult.updatedRecords,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed.');
  console.error(error);
  process.exitCode = 1;
});
