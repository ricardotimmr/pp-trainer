import type { AiCoachOutput } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { mapAiCoachOutput } from '../../mappers/mapAi.js';

function makeDbOutput(overrides: Partial<AiCoachOutput> = {}): AiCoachOutput {
  return {
    id: 'output-1',
    athleteProfileId: 'profile-1',
    athleteContextSnapshotId: null,
    outputType: 'WeekPlan',
    status: 'Draft',
    validationStatus: 'Valid',
    summary: null,
    rawText: null,
    structuredOutput: null,
    validationErrors: null,
    createdTrainingPlanId: null,
    createdPlannedWorkoutId: null,
    createdAt: new Date('2026-06-23T10:00:00.000Z'),
    updatedAt: new Date('2026-06-23T10:00:00.000Z'),
    ...overrides,
  } as unknown as AiCoachOutput;
}

describe('mapAiCoachOutput', () => {
  it('maps mandatory scalar fields', () => {
    const dto = mapAiCoachOutput(makeDbOutput({ id: 'out-abc' }));
    expect(dto.id).toBe('out-abc');
  });

  it('formats createdAt as ISO string', () => {
    const dto = mapAiCoachOutput(makeDbOutput({ createdAt: new Date('2026-06-23T10:00:00.000Z') }));
    expect(dto.createdAt).toBe('2026-06-23T10:00:00.000Z');
  });

  describe('outputType mapping', () => {
    it.each([
      ['WeekPlan', 'week_plan'],
      ['SingleWorkout', 'single_workout'],
    ] as const)('maps %s → %s', (prisma, dto) => {
      expect(mapAiCoachOutput(makeDbOutput({ outputType: prisma })).outputType).toBe(dto);
    });
  });

  describe('status mapping', () => {
    it.each([
      ['Draft', 'draft'],
      ['Accepted', 'accepted'],
      ['Rejected', 'rejected'],
      ['Archived', 'archived'],
    ] as const)('maps %s → %s', (prisma, dto) => {
      expect(mapAiCoachOutput(makeDbOutput({ status: prisma })).status).toBe(dto);
    });
  });

  describe('validationStatus mapping', () => {
    it.each([
      ['Valid', 'valid'],
      ['Invalid', 'invalid'],
      ['NotValidated', 'not_validated'],
      ['PartiallyValid', 'partially_valid'],
    ] as const)('maps %s → %s', (prisma, dto) => {
      expect(mapAiCoachOutput(makeDbOutput({ validationStatus: prisma })).validationStatus).toBe(dto);
    });
  });

  describe('optional fields', () => {
    it('omits summary when null', () => {
      const dto = mapAiCoachOutput(makeDbOutput({ summary: null }));
      expect('summary' in dto).toBe(false);
    });

    it('includes summary when present', () => {
      const dto = mapAiCoachOutput(makeDbOutput({ summary: 'A great week.' }));
      expect(dto.summary).toBe('A great week.');
    });

    it('omits rawText when null', () => {
      const dto = mapAiCoachOutput(makeDbOutput({ rawText: null }));
      expect('rawText' in dto).toBe(false);
    });

    it('includes rawText when present', () => {
      const dto = mapAiCoachOutput(makeDbOutput({ rawText: '{"raw":"json"}' }));
      expect(dto.rawText).toBe('{"raw":"json"}');
    });

    it('omits structuredOutput when null', () => {
      const dto = mapAiCoachOutput(makeDbOutput({ structuredOutput: null }));
      expect('structuredOutput' in dto).toBe(false);
    });

    it('includes structuredOutput when present', () => {
      const payload = { title: 'Week', workouts: [] };
      const dto = mapAiCoachOutput(makeDbOutput({ structuredOutput: payload as never }));
      expect(dto.structuredOutput).toEqual(payload);
    });

    it('omits createdTrainingPlanId when null', () => {
      const dto = mapAiCoachOutput(makeDbOutput({ createdTrainingPlanId: null }));
      expect('createdTrainingPlanId' in dto).toBe(false);
    });

    it('includes createdTrainingPlanId when present', () => {
      const dto = mapAiCoachOutput(makeDbOutput({ createdTrainingPlanId: 'plan-1' }));
      expect(dto.createdTrainingPlanId).toBe('plan-1');
    });

    it('omits createdPlannedWorkoutId when null', () => {
      const dto = mapAiCoachOutput(makeDbOutput({ createdPlannedWorkoutId: null }));
      expect('createdPlannedWorkoutId' in dto).toBe(false);
    });

    it('includes createdPlannedWorkoutId when present', () => {
      const dto = mapAiCoachOutput(makeDbOutput({ createdPlannedWorkoutId: 'workout-1' }));
      expect(dto.createdPlannedWorkoutId).toBe('workout-1');
    });
  });
});
