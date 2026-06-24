import type { AiCoachOutput } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as AiProviderClient from '../../ai/AiProviderClient.js';
import * as CoachingMemoryRepository from '../../repositories/CoachingMemoryRepository.js';
import { generateAndPersistMemoryEntry } from '../../services/MemoryEntryService.js';

vi.mock('../../ai/AiProviderClient.js');
vi.mock('../../repositories/CoachingMemoryRepository.js');

function makeOutput(overrides: Partial<AiCoachOutput> = {}): AiCoachOutput {
  return {
    id: 'output-1',
    athleteProfileId: 'profile-1',
    outputType: 'WeekPlan',
    status: 'Accepted',
    validationStatus: 'Valid',
    prompt: 'prompt text',
    summary: 'Week plan: 3 runs.',
    structuredOutput: { weekStartDate: '2026-06-23', weekEndDate: '2026-06-29', title: 'Week Plan', workouts: [] },
    rawOutput: null,
    validationErrors: null,
    contextSnapshotId: null,
    createdTrainingPlanId: null,
    createdPlannedWorkoutId: null,
    createdAt: new Date('2026-06-23T10:00:00Z'),
    updatedAt: new Date('2026-06-23T10:00:00Z'),
    ...overrides,
  } as AiCoachOutput;
}

describe('generateAndPersistMemoryEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AiProviderClient.generateMemoryEntry).mockResolvedValue('AI generated diary entry.');
    vi.mocked(CoachingMemoryRepository.createEntry).mockResolvedValue({} as never);
  });

  it('calls generateMemoryEntry with correct type for WeekPlan', async () => {
    const output = makeOutput({ outputType: 'WeekPlan' });
    await generateAndPersistMemoryEntry(output);

    expect(vi.mocked(AiProviderClient.generateMemoryEntry)).toHaveBeenCalledWith(
      'week_plan',
      'Week plan: 3 runs.',
      output.structuredOutput,
    );
  });

  it('calls generateMemoryEntry with correct type for SingleWorkout', async () => {
    const output = makeOutput({ outputType: 'SingleWorkout', summary: 'Tempo run.' });
    await generateAndPersistMemoryEntry(output);

    expect(vi.mocked(AiProviderClient.generateMemoryEntry)).toHaveBeenCalledWith(
      'single_workout',
      'Tempo run.',
      output.structuredOutput,
    );
  });

  it('persists entry with weekStartDate for WeekPlan', async () => {
    const output = makeOutput({
      outputType: 'WeekPlan',
      structuredOutput: { weekStartDate: '2026-06-23' },
    });
    await generateAndPersistMemoryEntry(output);

    expect(vi.mocked(CoachingMemoryRepository.createEntry)).toHaveBeenCalledWith(
      expect.objectContaining({
        athleteProfileId: 'profile-1',
        aiCoachOutputId: 'output-1',
        outputType: 'WeekPlan',
        entryText: 'AI generated diary entry.',
        weekStartDate: '2026-06-23',
      }),
    );
  });

  it('persists entry without weekStartDate for SingleWorkout', async () => {
    const output = makeOutput({ outputType: 'SingleWorkout' });
    await generateAndPersistMemoryEntry(output);

    expect(vi.mocked(CoachingMemoryRepository.createEntry)).toHaveBeenCalledWith(
      expect.objectContaining({
        outputType: 'SingleWorkout',
        weekStartDate: undefined,
      }),
    );
  });

  it('does not persist when AI returns empty string', async () => {
    vi.mocked(AiProviderClient.generateMemoryEntry).mockResolvedValue('');
    const output = makeOutput();
    await generateAndPersistMemoryEntry(output);

    expect(vi.mocked(CoachingMemoryRepository.createEntry)).not.toHaveBeenCalled();
  });

  it('does nothing for unknown outputType', async () => {
    const output = makeOutput({ outputType: 'WeekPlan' });
    // Simulate an unknown type by casting
    (output as unknown as Record<string, unknown>)['outputType'] = 'Unknown';
    await generateAndPersistMemoryEntry(output);

    expect(vi.mocked(AiProviderClient.generateMemoryEntry)).not.toHaveBeenCalled();
    expect(vi.mocked(CoachingMemoryRepository.createEntry)).not.toHaveBeenCalled();
  });

  it('passes null summary when summary is null', async () => {
    const output = makeOutput({ summary: null });
    await generateAndPersistMemoryEntry(output);

    expect(vi.mocked(AiProviderClient.generateMemoryEntry)).toHaveBeenCalledWith(
      'week_plan',
      null,
      expect.anything(),
    );
  });
});
