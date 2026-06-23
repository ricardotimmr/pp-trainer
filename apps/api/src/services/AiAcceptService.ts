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
import { mapAiCoachOutput } from '../mappers/mapAi.js';
import * as AiRepository from '../repositories/AiRepository.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as TrainingService from './TrainingService.js';

function zoneNotesSuffix(step: AiGeneratedWorkoutStep): string {
  const parts: string[] = [];
  if (step.targetHeartRateZoneName) parts.push(`HR: ${step.targetHeartRateZoneName}`);
  if (step.targetPowerZoneName) parts.push(`Power: ${step.targetPowerZoneName}`);
  if (step.targetPaceZoneName) parts.push(`Pace: ${step.targetPaceZoneName}`);
  return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
}

function mapAiStepsToCreateRequests(steps: AiGeneratedWorkoutStep[]) {
  return steps.map((step) => ({
    stepIndex: step.stepIndex,
    stepType: step.stepType,
    instruction: step.instruction + zoneNotesSuffix(step),
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
    ...(step.notes != null && { notes: step.notes }),
  }));
}

function mapAiWorkoutToCreateRequest(
  aiWorkout: AiGeneratedWorkout,
  fallbackDate: string,
  trainingPlanId?: string,
) {
  return {
    ...(trainingPlanId != null && { trainingPlanId }),
    title: aiWorkout.title,
    sport: aiWorkout.sport,
    workoutType: aiWorkout.workoutType,
    scheduledDate: aiWorkout.scheduledDate ?? fallbackDate,
    ...(aiWorkout.plannedDurationSeconds != null && { plannedDurationSeconds: aiWorkout.plannedDurationSeconds }),
    ...(aiWorkout.plannedDistanceMeters != null && { plannedDistanceMeters: aiWorkout.plannedDistanceMeters }),
    intensity: aiWorkout.intensity,
    status: 'planned' as const,
    ...(aiWorkout.objective != null && { objective: aiWorkout.objective }),
    ...(aiWorkout.description != null && { description: aiWorkout.description }),
    ...(aiWorkout.coachNotes != null && { coachNotes: aiWorkout.coachNotes }),
    source: 'ai_generated' as const,
    steps: mapAiStepsToCreateRequests(aiWorkout.steps),
  };
}

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

  if (output.outputType === 'WeekPlan') {
    const parsed = AiGeneratedWeekPlanSchema.safeParse(output.structuredOutput);
    if (!parsed.success) {
      throw ApiError.unprocessable('AI output structure is invalid', parsed.error.issues);
    }
    const plan = parsed.data;

    const createdPlan = await TrainingService.createTrainingPlan({
      title: plan.title,
      startDate: plan.weekStartDate,
      endDate: plan.weekEndDate,
      status: 'draft',
      source: 'ai_generated',
      ...(plan.focus != null && { description: plan.focus }),
    });

    await prisma.trainingPlan.update({
      where: { id: createdPlan.id },
      data: { aiCoachOutputId: outputId },
    });

    const createdWorkouts: PlannedWorkoutDto[] = [];
    for (const aiWorkout of plan.workouts) {
      const workout = await TrainingService.createWorkout(
        mapAiWorkoutToCreateRequest(aiWorkout, plan.weekStartDate, createdPlan.id),
      );
      await prisma.plannedWorkout.update({
        where: { id: workout.id },
        data: { aiCoachOutputId: outputId },
      });
      createdWorkouts.push(workout);
    }

    await AiRepository.updateOutput(outputId, {
      status: 'Accepted',
      createdTrainingPlanId: createdPlan.id,
    });

    return { ...createdPlan, plannedWorkouts: createdWorkouts } satisfies TrainingPlanDto;
  }

  // single_workout
  const parsed = AiGeneratedSingleWorkoutSchema.safeParse(output.structuredOutput);
  if (!parsed.success) {
    throw ApiError.unprocessable('AI output structure is invalid', parsed.error.issues);
  }
  const aiWorkout = parsed.data.workout;
  const today = new Date().toISOString().split('T')[0];

  const workout = await TrainingService.createWorkout(
    mapAiWorkoutToCreateRequest(aiWorkout, today),
  );

  await prisma.plannedWorkout.update({
    where: { id: workout.id },
    data: { aiCoachOutputId: outputId },
  });

  await AiRepository.updateOutput(outputId, {
    status: 'Accepted',
    createdPlannedWorkoutId: workout.id,
  });

  return workout;
}

export async function rejectOutput(outputId: string): Promise<{ success: true }> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (profile == null) throw ApiError.notFound('Athlete profile not found');

  await assertDraftOwnership(outputId, profile.id);

  await AiRepository.updateOutput(outputId, { status: 'Rejected' });

  return { success: true };
}
