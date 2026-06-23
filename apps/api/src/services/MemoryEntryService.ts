import type { AiCoachOutput } from '@prisma/client';

import * as AiProviderClient from '../ai/AiProviderClient.js';
import * as CoachingMemoryRepository from '../repositories/CoachingMemoryRepository.js';

function resolveOutputType(
  outputType: AiCoachOutput['outputType'],
): 'week_plan' | 'single_workout' | null {
  if (outputType === 'WeekPlan') return 'week_plan';
  if (outputType === 'SingleWorkout') return 'single_workout';
  return null;
}

function resolveWeekStartDate(output: AiCoachOutput): string | undefined {
  if (output.outputType !== 'WeekPlan') return undefined;
  const structured = output.structuredOutput as Record<string, unknown> | null;
  const date = structured?.['weekStartDate'];
  return typeof date === 'string' ? date : undefined;
}

export async function generateAndPersistMemoryEntry(output: AiCoachOutput): Promise<void> {
  const type = resolveOutputType(output.outputType);
  if (type == null) return;

  const entryText = await AiProviderClient.generateMemoryEntry(
    type,
    output.summary ?? null,
    output.structuredOutput,
  );

  if (!entryText) return;

  await CoachingMemoryRepository.createEntry({
    athleteProfileId: output.athleteProfileId,
    aiCoachOutputId: output.id,
    outputType: output.outputType,
    entryText,
    weekStartDate: resolveWeekStartDate(output),
  });
}
