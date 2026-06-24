import type { AiCoachOutputDto, GenerateWeekPlanRequest, GenerateWorkoutRequest } from '@pp-trainer/shared';

import * as AiProviderClient from '../ai/AiProviderClient.js';
import { ApiError } from '../errors/ApiError.js';
import { mapAiCoachOutput } from '../mappers/mapAi.js';
import * as AiRepository from '../repositories/AiRepository.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as AthleteContextBuilder from './AthleteContextBuilder.js';

export async function getHistory(limit: number): Promise<AiCoachOutputDto[]> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (profile == null) return [];
  const outputs = await AiRepository.findRecentOutputs(profile.id, limit);
  return outputs.map(mapAiCoachOutput);
}

export async function generateWeekPlan(request: GenerateWeekPlanRequest): Promise<AiCoachOutputDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (profile == null) throw ApiError.notFound('Athlete profile not found');

  const context = await AthleteContextBuilder.buildContext(profile.id);
  const snapshot = await AthleteContextBuilder.persistSnapshot(profile.id, context);

  const result = await AiProviderClient.generateWeekPlan(
    context,
    request.weekStartDate,
    request.userInstruction,
  );

  const validationStatus = result.data != null ? 'Valid' : 'Invalid';
  const structuredOutput = result.data ?? result.rawOutput;
  const summary = result.data != null ? result.data.summary : undefined;

  const output = await AiRepository.createOutput({
    athleteProfileId: profile.id,
    athleteContextSnapshotId: snapshot.id,
    outputType: 'WeekPlan',
    status: 'Draft',
    validationStatus,
    ...(summary != null && { summary }),
    ...(structuredOutput != null && { structuredOutput }),
    ...(result.validationErrors != null && { validationErrors: result.validationErrors }),
  });

  return mapAiCoachOutput(output);
}

export async function generateWorkout(request: GenerateWorkoutRequest): Promise<AiCoachOutputDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (profile == null) throw ApiError.notFound('Athlete profile not found');

  const context = await AthleteContextBuilder.buildContext(profile.id);
  const snapshot = await AthleteContextBuilder.persistSnapshot(profile.id, context);

  const objective = `${request.intensity} ${request.sport} workout`;

  const result = await AiProviderClient.generateSingleWorkout(
    context,
    request.sport,
    objective,
    request.plannedDurationSeconds,
    request.userInstruction,
  );

  const validationStatus = result.data != null ? 'Valid' : 'Invalid';
  const structuredOutput = result.data ?? result.rawOutput;
  const summary = result.data != null ? (result.data.workout.objective ?? result.data.workout.description) : undefined;

  const output = await AiRepository.createOutput({
    athleteProfileId: profile.id,
    athleteContextSnapshotId: snapshot.id,
    outputType: 'SingleWorkout',
    status: 'Draft',
    validationStatus,
    ...(summary != null && { summary }),
    ...(structuredOutput != null && { structuredOutput }),
    ...(result.validationErrors != null && { validationErrors: result.validationErrors }),
  });

  return mapAiCoachOutput(output);
}
