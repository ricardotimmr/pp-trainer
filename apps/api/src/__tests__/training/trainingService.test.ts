import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as AthleteRepository from '../../repositories/AthleteRepository.js';
import * as TrainingRepository from '../../repositories/TrainingRepository.js';
import {
  createTrainingPlan,
  createWorkout,
  deleteTrainingPlan,
  deleteWorkout,
  updateTrainingPlan,
  updateWorkout,
} from '../../services/TrainingService.js';

vi.mock('../../lib/prisma.js', () => ({ prisma: {}, disconnectPrisma: vi.fn() }));
vi.mock('../../repositories/AthleteRepository.js');
vi.mock('../../repositories/TrainingRepository.js');

const mockProfile = { id: 'profile-1', displayName: 'Test Athlete' } as never;

const mockPlanRow = {
  id: 'plan-1',
  athleteProfileId: 'profile-1',
  title: 'Base Phase',
  description: null,
  startDate: new Date('2024-06-03'),
  endDate: new Date('2024-08-25'),
  status: 'Active',
  source: 'Manual',
  goalId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  plannedWorkouts: [],
} as never;

const mockWorkoutRow = {
  id: 'wo-1',
  athleteProfileId: 'profile-1',
  trainingPlanId: null,
  title: 'Easy Run',
  sport: 'Running',
  workoutType: 'Endurance',
  scheduledDate: new Date('2024-06-10'),
  scheduledStartTime: null,
  plannedDurationSeconds: 3600,
  plannedDistanceMeters: null,
  intensity: 'Easy',
  status: 'Planned',
  objective: null,
  description: null,
  coachNotes: null,
  source: 'Manual',
  createdAt: new Date(),
  updatedAt: new Date(),
  steps: [],
} as never;

const minimalPlanInput = {
  title: 'Base Phase',
  startDate: '2024-06-03',
  endDate: '2024-08-25',
  status: 'draft' as const,
};

const minimalWorkoutInput = {
  title: 'Easy Run',
  sport: 'running' as const,
  workoutType: 'endurance' as const,
  scheduledDate: '2024-06-10',
  intensity: 'easy' as const,
  status: 'planned' as const,
  steps: [] as never[],
};

// ── createTrainingPlan() ──────────────────────────────────────────────────────

describe('createTrainingPlan()', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls repository with correct athleteProfileId and source Manual', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.createTrainingPlan).mockResolvedValue(mockPlanRow);
    await createTrainingPlan(minimalPlanInput);
    expect(TrainingRepository.createTrainingPlan).toHaveBeenCalledWith(
      expect.objectContaining({ athleteProfileId: 'profile-1', source: 'Manual' }),
    );
  });

  it('throws 404 when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    await expect(createTrainingPlan(minimalPlanInput)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

// ── updateTrainingPlan() ──────────────────────────────────────────────────────

describe('updateTrainingPlan()', () => {
  beforeEach(() => vi.resetAllMocks());

  it('throws 404 for an unknown plan id', async () => {
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(null);
    await expect(updateTrainingPlan('no-such-plan', { title: 'New' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('calls updateTrainingPlan repository when plan exists', async () => {
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(mockPlanRow);
    vi.mocked(TrainingRepository.updateTrainingPlan).mockResolvedValue(mockPlanRow);
    await updateTrainingPlan('plan-1', { title: 'Updated Title' });
    expect(TrainingRepository.updateTrainingPlan).toHaveBeenCalledWith(
      'plan-1',
      expect.objectContaining({ title: 'Updated Title' }),
    );
  });
});

// ── createWorkout() ───────────────────────────────────────────────────────────

describe('createWorkout()', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls repository with source Manual', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.createPlannedWorkout).mockResolvedValue(mockWorkoutRow);
    await createWorkout(minimalWorkoutInput);
    expect(TrainingRepository.createPlannedWorkout).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'Manual', athleteProfileId: 'profile-1' }),
    );
  });

  it('throws 404 when trainingPlanId does not exist', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(null);
    await expect(
      createWorkout({ ...minimalWorkoutInput, trainingPlanId: 'no-such-plan' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws BAD_REQUEST for duplicate stepIndex values', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    await expect(
      createWorkout({
        ...minimalWorkoutInput,
        steps: [
          { stepIndex: 0, stepType: 'warmup', instruction: 'warm up' },
          { stepIndex: 0, stepType: 'main', instruction: 'main set' },
        ] as never[],
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('throws 404 when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    await expect(createWorkout(minimalWorkoutInput)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── updateWorkout() ───────────────────────────────────────────────────────────

describe('updateWorkout()', () => {
  beforeEach(() => vi.resetAllMocks());

  it('throws 404 for an unknown workout id', async () => {
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(null);
    await expect(updateWorkout('no-such-workout', { title: 'New' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws BAD_REQUEST for duplicate stepIndex on update', async () => {
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(mockWorkoutRow);
    await expect(
      updateWorkout('wo-1', {
        steps: [
          { stepIndex: 1, stepType: 'warmup', instruction: 'a' },
          { stepIndex: 1, stepType: 'main', instruction: 'b' },
        ] as never[],
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

// ── deleteWorkout() ───────────────────────────────────────────────────────────

describe('deleteWorkout()', () => {
  beforeEach(() => vi.resetAllMocks());

  it('throws 404 for an unknown workout id', async () => {
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(null);
    await expect(deleteWorkout('no-such-workout')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('calls deletePlannedWorkout for a known workout', async () => {
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(mockWorkoutRow);
    vi.mocked(TrainingRepository.deletePlannedWorkout).mockResolvedValue(undefined);
    await deleteWorkout('wo-1');
    expect(TrainingRepository.deletePlannedWorkout).toHaveBeenCalledWith('wo-1');
  });
});

// ── deleteTrainingPlan() ──────────────────────────────────────────────────────

describe('deleteTrainingPlan()', () => {
  beforeEach(() => vi.resetAllMocks());

  it('throws 404 for an unknown plan id', async () => {
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(null);
    await expect(deleteTrainingPlan('no-such-plan')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('calls deleteTrainingPlan repository for a known plan', async () => {
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(mockPlanRow);
    vi.mocked(TrainingRepository.deleteTrainingPlan).mockResolvedValue(undefined);
    await deleteTrainingPlan('plan-1');
    expect(TrainingRepository.deleteTrainingPlan).toHaveBeenCalledWith('plan-1');
  });
});
