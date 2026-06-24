import {
  AiGeneratedSingleWorkoutSchema,
  AiGeneratedWeekPlanSchema,
  type AiGeneratedWorkout,
  type AiGeneratedWorkoutStep,
  type PlannedWorkoutDto,
  type TrainingPlanDto,
} from '@pp-trainer/shared';

import type { AiCoachOutputDto } from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import { prisma } from '../lib/prisma.js';
import {
  DTO_TO_PRISMA_PLANNED_WORKOUT_SOURCE_MAP,
  DTO_TO_PRISMA_SPORT_MAP,
  DTO_TO_PRISMA_WORKOUT_INTENSITY_MAP,
  DTO_TO_PRISMA_WORKOUT_STATUS_MAP,
  DTO_TO_PRISMA_WORKOUT_STEP_TYPE_MAP,
  DTO_TO_PRISMA_WORKOUT_TYPE_MAP,
} from '../mappers/enumMaps.js';
import { mapAiCoachOutput } from '../mappers/mapAi.js';
import { mapPlannedWorkout, mapTrainingPlan } from '../mappers/mapTraining.js';
import * as AiRepository from '../repositories/AiRepository.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as MemoryEntryService from './MemoryEntryService.js';

// ── Zone FK resolution ───────────────────────────────────────────────────────

type ZoneWithType = { id: string; name: string; zoneType: string };

export type ZoneLookup = {
  hr: Map<string, string>;
  power: Map<string, string>;
  pace: Map<string, string>;
};

export function buildZoneLookup(zones: ZoneWithType[]): ZoneLookup {
  const hr = new Map<string, string>();
  const power = new Map<string, string>();
  const pace = new Map<string, string>();

  for (const zone of zones) {
    const key = zone.name.toLowerCase().trim();
    switch (zone.zoneType) {
      case 'HeartRate': hr.set(key, zone.id); break;
      case 'CyclingPower': power.set(key, zone.id); break;
      case 'RunningPace':
      case 'SwimmingPace': pace.set(key, zone.id); break;
    }
  }

  return { hr, power, pace };
}

export function resolveStepZoneFks(
  step: Pick<AiGeneratedWorkoutStep, 'targetHeartRateZoneName' | 'targetPowerZoneName' | 'targetPaceZoneName'>,
  lookup: ZoneLookup,
): { targetHeartRateZoneId?: string; targetPowerZoneId?: string; targetPaceZoneId?: string } {
  const result: { targetHeartRateZoneId?: string; targetPowerZoneId?: string; targetPaceZoneId?: string } = {};

  if (step.targetHeartRateZoneName) {
    const id = lookup.hr.get(step.targetHeartRateZoneName.toLowerCase().trim());
    if (id != null) result.targetHeartRateZoneId = id;
  }
  if (step.targetPowerZoneName) {
    const id = lookup.power.get(step.targetPowerZoneName.toLowerCase().trim());
    if (id != null) result.targetPowerZoneId = id;
  }
  if (step.targetPaceZoneName) {
    const id = lookup.pace.get(step.targetPaceZoneName.toLowerCase().trim());
    if (id != null) result.targetPaceZoneId = id;
  }

  return result;
}

async function loadZones(athleteProfileId: string): Promise<ZoneWithType[]> {
  const sets = await prisma.trainingZoneSet.findMany({
    where: { athleteProfileId, isActive: true },
    select: {
      zoneType: true,
      zones: { select: { id: true, name: true } },
    },
  });
  return sets.flatMap((s) => s.zones.map((z) => ({ ...z, zoneType: s.zoneType as string })));
}

// ── Step mapping ─────────────────────────────────────────────────────────────

function buildZoneNotes(step: AiGeneratedWorkoutStep): string | undefined {
  const parts: string[] = [];
  if (step.targetHeartRateZoneName) parts.push(step.targetHeartRateZoneName);
  if (step.targetPowerZoneName) parts.push(step.targetPowerZoneName);
  if (step.targetPaceZoneName) parts.push(step.targetPaceZoneName);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

function mapAiStepsToPrisma(steps: AiGeneratedWorkoutStep[], zoneLookup: ZoneLookup) {
  return [...steps]
    .sort((a, b) => a.stepIndex - b.stepIndex)
    .map((step) => {
      const notes = buildZoneNotes(step) ?? step.notes ?? undefined;
      const zoneFks = resolveStepZoneFks(step, zoneLookup);
      return {
        stepIndex: step.stepIndex,
        stepType: DTO_TO_PRISMA_WORKOUT_STEP_TYPE_MAP[step.stepType],
        instruction: step.instruction,
        ...(step.title != null && { title: step.title }),
        ...(step.durationSeconds != null && { durationSeconds: step.durationSeconds }),
        ...(step.distanceMeters != null && { distanceMeters: step.distanceMeters }),
        ...(step.repetitions != null && { repetitions: step.repetitions }),
        ...(step.targetPowerLowerWatts != null && { targetPowerLowerWatts: step.targetPowerLowerWatts }),
        ...(step.targetPowerUpperWatts != null && { targetPowerUpperWatts: step.targetPowerUpperWatts }),
        ...(step.targetPaceLowerSecPerKm != null && { targetPaceLowerSecPerKm: step.targetPaceLowerSecPerKm }),
        ...(step.targetPaceUpperSecPerKm != null && { targetPaceUpperSecPerKm: step.targetPaceUpperSecPerKm }),
        ...(step.targetSwimPaceLowerSecPer100m != null && { targetSwimPaceLowerSecPer100m: step.targetSwimPaceLowerSecPer100m }),
        ...(step.targetSwimPaceUpperSecPer100m != null && { targetSwimPaceUpperSecPer100m: step.targetSwimPaceUpperSecPer100m }),
        ...(step.restSeconds != null && { restSeconds: step.restSeconds }),
        ...(notes != null && { notes }),
        ...zoneFks,
      };
    });
}

function buildWorkoutPrismaInput(
  aiWorkout: AiGeneratedWorkout,
  athleteProfileId: string,
  fallbackDate: string,
  zoneLookup: ZoneLookup,
) {
  return {
    athleteProfileId,
    title: aiWorkout.title,
    sport: DTO_TO_PRISMA_SPORT_MAP[aiWorkout.sport],
    workoutType: DTO_TO_PRISMA_WORKOUT_TYPE_MAP[aiWorkout.workoutType],
    scheduledDate: new Date(aiWorkout.scheduledDate ?? fallbackDate),
    ...(aiWorkout.plannedDurationSeconds != null && { plannedDurationSeconds: aiWorkout.plannedDurationSeconds }),
    ...(aiWorkout.plannedDistanceMeters != null && { plannedDistanceMeters: aiWorkout.plannedDistanceMeters }),
    intensity: DTO_TO_PRISMA_WORKOUT_INTENSITY_MAP[aiWorkout.intensity],
    status: DTO_TO_PRISMA_WORKOUT_STATUS_MAP['planned'],
    ...(aiWorkout.objective != null && { objective: aiWorkout.objective }),
    ...(aiWorkout.description != null && { description: aiWorkout.description }),
    ...(aiWorkout.coachNotes != null && { coachNotes: aiWorkout.coachNotes }),
    source: DTO_TO_PRISMA_PLANNED_WORKOUT_SOURCE_MAP['ai_generated'],
    steps: mapAiStepsToPrisma(aiWorkout.steps, zoneLookup),
  };
}

const WORKOUT_STEPS_INCLUDE = { steps: { orderBy: { stepIndex: 'asc' } } } as const;
const PLAN_WORKOUTS_INCLUDE = {
  plannedWorkouts: {
    include: WORKOUT_STEPS_INCLUDE,
    orderBy: { scheduledDate: 'asc' as const },
  },
} as const;

async function assertDraftOwnership(outputId: string, athleteProfileId: string) {
  const output = await AiRepository.findOutput(outputId);
  if (output == null) throw ApiError.notFound('AI output not found');
  if (output.athleteProfileId !== athleteProfileId) throw ApiError.forbidden();
  if (output.status !== 'Draft') throw ApiError.conflict('AI output has already been accepted or rejected');
  return output;
}

export async function getOutput(outputId: string): Promise<AiCoachOutputDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (profile == null) throw ApiError.notFound('Athlete profile not found');

  const output = await AiRepository.findOutput(outputId);
  if (output == null) throw ApiError.notFound('AI output not found');
  if (output.athleteProfileId !== profile.id) throw ApiError.forbidden();

  return mapAiCoachOutput(output);
}

export async function acceptOutput(outputId: string): Promise<TrainingPlanDto | PlannedWorkoutDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (profile == null) throw ApiError.notFound('Athlete profile not found');

  const output = await assertDraftOwnership(outputId, profile.id);

  if (output.validationStatus === 'Invalid') {
    throw ApiError.unprocessable('AI output failed validation and cannot be accepted');
  }

  const zoneLookup = buildZoneLookup(await loadZones(profile.id));

  if (output.outputType === 'WeekPlan') {
    const parsed = AiGeneratedWeekPlanSchema.safeParse(output.structuredOutput);
    if (!parsed.success) {
      throw ApiError.unprocessable('AI output structure is invalid', parsed.error.issues);
    }
    const plan = parsed.data;

    // Pre-compute all Prisma-mapped inputs outside the transaction (pure mapping, no DB calls)
    const workoutInputs = plan.workouts.map((w) =>
      buildWorkoutPrismaInput(w, profile.id, plan.weekStartDate, zoneLookup),
    );

    const { txPlan, txWorkouts, txOutput } = await prisma.$transaction(async (tx) => {
      await tx.trainingPlan.updateMany({
        where: { athleteProfileId: profile.id, status: 'Active' },
        data: { status: 'Draft' },
      });

      const txPlan = await tx.trainingPlan.create({
        data: {
          athleteProfileId: profile.id,
          title: plan.title,
          startDate: new Date(plan.weekStartDate),
          endDate: new Date(plan.weekEndDate),
          status: 'Active',
          source: 'AiGenerated',
          aiCoachOutputId: outputId,
          ...(plan.focus != null && { description: plan.focus }),
        },
        include: PLAN_WORKOUTS_INCLUDE,
      });

      const txWorkouts = [];
      for (const { steps, ...workoutData } of workoutInputs) {
        const w = await tx.plannedWorkout.create({
          data: {
            ...workoutData,
            trainingPlanId: txPlan.id,
            aiCoachOutputId: outputId,
            steps: { create: steps },
          },
          include: WORKOUT_STEPS_INCLUDE,
        });
        txWorkouts.push(w);
      }

      const txOutput = await tx.aiCoachOutput.update({
        where: { id: outputId },
        data: { status: 'Accepted', createdTrainingPlanId: txPlan.id },
      });

      return { txPlan, txWorkouts, txOutput };
    });

    void MemoryEntryService.generateAndPersistMemoryEntry(txOutput).catch(() => undefined);

    return mapTrainingPlan({
      ...txPlan,
      plannedWorkouts: txWorkouts.sort(
        (a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime(),
      ),
    }) satisfies TrainingPlanDto;
  }

  // single_workout
  const parsed = AiGeneratedSingleWorkoutSchema.safeParse(output.structuredOutput);
  if (!parsed.success) {
    throw ApiError.unprocessable('AI output structure is invalid', parsed.error.issues);
  }
  const aiWorkout = parsed.data.workout;
  const today = new Date().toISOString().split('T')[0];

  // Pre-compute Prisma input outside the transaction
  const { steps, ...workoutData } = buildWorkoutPrismaInput(aiWorkout, profile.id, today, zoneLookup);

  const { txWorkout, txOutput } = await prisma.$transaction(async (tx) => {
    const txWorkout = await tx.plannedWorkout.create({
      data: {
        ...workoutData,
        aiCoachOutputId: outputId,
        steps: { create: steps },
      },
      include: WORKOUT_STEPS_INCLUDE,
    });

    const txOutput = await tx.aiCoachOutput.update({
      where: { id: outputId },
      data: { status: 'Accepted', createdPlannedWorkoutId: txWorkout.id },
    });

    return { txWorkout, txOutput };
  });

  void MemoryEntryService.generateAndPersistMemoryEntry(txOutput).catch(() => undefined);

  return mapPlannedWorkout(txWorkout);
}

export async function rejectOutput(outputId: string): Promise<{ success: true }> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (profile == null) throw ApiError.notFound('Athlete profile not found');

  await assertDraftOwnership(outputId, profile.id);

  await AiRepository.updateOutput(outputId, { status: 'Rejected' });

  return { success: true };
}
