import type {
  AiCoachOutputDto,
  GenerateWeekAnalysisRequest,
  GenerateWeekPlanRequest,
  GenerateWorkoutRequest,
} from '@pp-trainer/shared';

import * as AiProviderClient from '../ai/AiProviderClient.js';
import { ApiError } from '../errors/ApiError.js';
import { mapAiCoachOutput } from '../mappers/mapAi.js';
import * as ActivityRepository from '../repositories/ActivityRepository.js';
import * as AiRepository from '../repositories/AiRepository.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import { getLastCompletedWeekRange, getWeekRangeFromStart } from '../utils/dateUtils.js';
import * as AthleteContextBuilder from './AthleteContextBuilder.js';
import { enrichSingleWorkoutDistances, enrichWeekPlanDistances } from './AiWorkoutDistanceEstimator.js';

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

  const zoneSets = (await AthleteRepository.findAthleteZoneSets(profile.id)) ?? [];
  const enrichedData = result.data != null ? enrichWeekPlanDistances(result.data, zoneSets) : null;
  const validationStatus = enrichedData != null ? 'Valid' : 'Invalid';
  const structuredOutput = enrichedData ?? result.rawOutput;
  const summary = enrichedData != null ? enrichedData.summary : undefined;

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

  const zoneSets = (await AthleteRepository.findAthleteZoneSets(profile.id)) ?? [];
  const enrichedData = result.data != null ? enrichSingleWorkoutDistances(result.data, zoneSets) : null;
  const validationStatus = enrichedData != null ? 'Valid' : 'Invalid';
  const structuredOutput = enrichedData ?? result.rawOutput;
  const summary = enrichedData != null ? (enrichedData.workout.objective ?? enrichedData.workout.description) : undefined;

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

export async function generateWeekAnalysis(
  request: GenerateWeekAnalysisRequest,
): Promise<AiCoachOutputDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (profile == null) throw ApiError.notFound('Athlete profile not found');

  const { weekStart, weekEnd } = request.weekStartDate
    ? getWeekRangeFromStart(request.weekStartDate)
    : getLastCompletedWeekRange();

  const weekEndInclusive = new Date(weekEnd);
  weekEndInclusive.setUTCHours(23, 59, 59, 999);

  const activities = await ActivityRepository.findActivities(profile.id, {
    startTimeFrom: weekStart,
    startTimeTo: weekEndInclusive,
  });

  const context = await AthleteContextBuilder.buildContext(profile.id);
  const snapshot = await AthleteContextBuilder.persistSnapshot(profile.id, context);

  const toDateStr = (d: Date) => d.toISOString().split('T')[0];

  const weekInput = {
    weekStartDate: toDateStr(weekStart),
    weekEndDate: toDateStr(weekEnd),
    activities: activities.map((act) => ({
      sport: act.sport.toLowerCase(),
      startTime: act.startTime.toISOString(),
      durationSeconds: act.durationSeconds,
      ...(act.distanceMeters != null && { distanceMeters: act.distanceMeters }),
      ...(act.averageHeartRateBpm != null && { averageHeartRateBpm: act.averageHeartRateBpm }),
      ...(act.averagePowerWatts != null && { averagePowerWatts: act.averagePowerWatts }),
      ...(act.averagePaceSecPerKm != null && { averagePaceSecPerKm: act.averagePaceSecPerKm }),
    })),
  };

  const result = await AiProviderClient.generateWeekAnalysis(context, weekInput);

  const validationStatus = result.data != null ? 'Valid' : 'Invalid';
  const structuredOutput = result.data ?? result.rawOutput;
  const summary = result.data?.keyObservations[0];

  const output = await AiRepository.createOutput({
    athleteProfileId: profile.id,
    athleteContextSnapshotId: snapshot.id,
    outputType: 'WeekAnalysis',
    status: 'Draft',
    validationStatus,
    ...(summary != null && { summary }),
    ...(structuredOutput != null && { structuredOutput }),
    ...(result.validationErrors != null && { validationErrors: result.validationErrors }),
  });

  return mapAiCoachOutput(output);
}
