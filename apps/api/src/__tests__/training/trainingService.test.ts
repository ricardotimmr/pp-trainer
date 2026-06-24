import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as AthleteRepository from '../../repositories/AthleteRepository.js';
import * as TrainingRepository from '../../repositories/TrainingRepository.js';
import {
  createTrainingPlan,
  createWorkout,
  deleteTrainingPlan,
  deleteWorkout,
  getCurrentWeekPlan,
  getTrainingPlanById,
  getWorkoutById,
  listTrainingPlans,
  listWorkouts,
  updateTrainingPlan,
  updateWorkout,
  validateStatusTransition,
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

// ── getCurrentWeekPlan() ──────────────────────────────────────────────────────

describe('getCurrentWeekPlan()', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns null plan when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    const result = await getCurrentWeekPlan();
    expect(result).toEqual({ currentTrainingPlan: null });
  });

  it('returns null plan when no active plan found', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.findActivePlanWithWeekWorkouts).mockResolvedValue(null);
    const result = await getCurrentWeekPlan();
    expect(result).toEqual({ currentTrainingPlan: null });
  });

  it('returns mapped plan when active plan exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.findActivePlanWithWeekWorkouts).mockResolvedValue(mockPlanRow);
    const result = await getCurrentWeekPlan();
    expect(result.currentTrainingPlan).not.toBeNull();
    expect(result.currentTrainingPlan?.id).toBe('plan-1');
  });
});

// ── getTrainingPlanById() ─────────────────────────────────────────────────────

describe('getTrainingPlanById()', () => {
  beforeEach(() => vi.resetAllMocks());

  it('throws 404 when plan does not exist', async () => {
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(null);
    await expect(getTrainingPlanById('no-such-plan')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns mapped plan when plan exists', async () => {
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(mockPlanRow);
    const result = await getTrainingPlanById('plan-1');
    expect(result.id).toBe('plan-1');
    expect(result.title).toBe('Base Phase');
  });
});

// ── getWorkoutById() ──────────────────────────────────────────────────────────

describe('getWorkoutById()', () => {
  beforeEach(() => vi.resetAllMocks());

  it('throws 404 when workout does not exist', async () => {
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(null);
    await expect(getWorkoutById('no-such-workout')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns mapped workout when workout exists', async () => {
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(mockWorkoutRow);
    const result = await getWorkoutById('wo-1');
    expect(result.id).toBe('wo-1');
    expect(result.title).toBe('Easy Run');
    expect(result.sport).toBe('running');
  });
});

// ── listTrainingPlans() ───────────────────────────────────────────────────────

describe('listTrainingPlans()', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns empty array when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    const result = await listTrainingPlans();
    expect(result).toEqual([]);
  });

  it('returns mapped summaries when plans exist', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.listTrainingPlans).mockResolvedValue([mockPlanRow]);
    const result = await listTrainingPlans();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('plan-1');
  });
});

// ── listWorkouts() ────────────────────────────────────────────────────────────

describe('listWorkouts()', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns empty array when no athlete profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    const result = await listWorkouts();
    expect(result).toEqual([]);
  });

  it('passes date range params to repository', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.listWorkouts).mockResolvedValue([mockWorkoutRow]);
    const from = new Date('2024-06-01');
    const to = new Date('2024-06-30');
    await listWorkouts(from, to);
    expect(TrainingRepository.listWorkouts).toHaveBeenCalledWith('profile-1', from, to);
  });
});

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

  it('uses provided source value', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.createTrainingPlan).mockResolvedValue(mockPlanRow);
    await createTrainingPlan({ ...minimalPlanInput, source: 'ai_generated' });
    expect(TrainingRepository.createTrainingPlan).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'AiGenerated' }),
    );
  });

  it('deactivates other active plans when creating an active plan (H3)', async () => {
    // mockPlanRow already has status: 'Active'
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.createTrainingPlan).mockResolvedValue(mockPlanRow);
    vi.mocked(TrainingRepository.deactivateOtherActivePlans).mockResolvedValue(undefined);
    await createTrainingPlan({ ...minimalPlanInput, status: 'active' });
    expect(TrainingRepository.deactivateOtherActivePlans).toHaveBeenCalledWith('profile-1', 'plan-1');
  });

  it('does not call deactivateOtherActivePlans for a draft plan', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.createTrainingPlan).mockResolvedValue(mockPlanRow);
    await createTrainingPlan(minimalPlanInput);
    expect(TrainingRepository.deactivateOtherActivePlans).not.toHaveBeenCalled();
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

  it('throws BAD_REQUEST when new startDate would be after existing endDate (M2)', async () => {
    const plan = Object.assign({}, mockPlanRow, { endDate: new Date('2024-06-10') }) as never;
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(plan);
    await expect(
      updateTrainingPlan('plan-1', { startDate: '2024-08-01' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('throws BAD_REQUEST when new endDate would be before existing startDate (M2)', async () => {
    const plan = Object.assign({}, mockPlanRow, { startDate: new Date('2024-06-03') }) as never;
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(plan);
    await expect(
      updateTrainingPlan('plan-1', { endDate: '2024-05-01' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('deactivates other active plans when activating (H3)', async () => {
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(mockPlanRow);
    vi.mocked(TrainingRepository.updateTrainingPlan).mockResolvedValue(mockPlanRow);
    vi.mocked(TrainingRepository.deactivateOtherActivePlans).mockResolvedValue(undefined);
    await updateTrainingPlan('plan-1', { status: 'active' });
    expect(TrainingRepository.deactivateOtherActivePlans).toHaveBeenCalledWith('profile-1', 'plan-1');
  });

  it('does not call deactivateOtherActivePlans when status stays draft', async () => {
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(mockPlanRow);
    vi.mocked(TrainingRepository.updateTrainingPlan).mockResolvedValue(mockPlanRow);
    await updateTrainingPlan('plan-1', { title: 'No Status Change' });
    expect(TrainingRepository.deactivateOtherActivePlans).not.toHaveBeenCalled();
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

// ── validateStatusTransition() ────────────────────────────────────────────────

describe('validateStatusTransition()', () => {
  // Valid transitions — must not throw
  it.each([
    ['Planned',   'Completed'],
    ['Planned',   'Missed'],
    ['Planned',   'Cancelled'],
    ['Completed', 'Planned'],
    ['Missed',    'Planned'],
    ['Cancelled', 'Planned'],
    ['Moved',     'Planned'],
    ['Moved',     'Completed'],
    ['Moved',     'Cancelled'],
    ['Adjusted',  'Planned'],
    ['Adjusted',  'Completed'],
    ['Adjusted',  'Cancelled'],
  ] as const)('allows %s → %s', (from, to) => {
    expect(() => validateStatusTransition(from, to)).not.toThrow();
  });

  // Same-status is always a no-op — must not throw
  it.each([
    ['Planned'],
    ['Completed'],
    ['Cancelled'],
    ['Missed'],
  ] as const)('allows no-op %s → %s', (status) => {
    expect(() => validateStatusTransition(status, status)).not.toThrow();
  });

  // Invalid transitions — must throw UNPROCESSABLE
  it.each([
    ['Completed', 'Cancelled'],
    ['Completed', 'Missed'],
    ['Missed',    'Cancelled'],
    ['Missed',    'Completed'],
    ['Cancelled', 'Completed'],
    ['Cancelled', 'Missed'],
    ['Planned',   'Planned'], // same → no-op allowed above, listed here for completeness (passes)
  ] as [string, string][])('rejects %s → %s with UNPROCESSABLE', (from, to) => {
    if (from === to) {
      expect(() => validateStatusTransition(from as never, to as never)).not.toThrow();
    } else {
      expect(() => validateStatusTransition(from as never, to as never)).toThrow(
        expect.objectContaining({ code: 'UNPROCESSABLE' }),
      );
    }
  });
});

// ── updateWorkout() status guard (integration) ────────────────────────────────

describe('updateWorkout() status transition guard', () => {
  beforeEach(() => vi.resetAllMocks());

  it('rejects Completed → Cancelled with 422', async () => {
    const completedWorkout = Object.assign({}, mockWorkoutRow, { status: 'Completed' }) as never;
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(completedWorkout);
    await expect(
      updateWorkout('wo-1', { status: 'cancelled' }),
    ).rejects.toMatchObject({ code: 'UNPROCESSABLE' });
  });

  it('rejects Cancelled → Completed with 422', async () => {
    const cancelledWorkout = Object.assign({}, mockWorkoutRow, { status: 'Cancelled' }) as never;
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(cancelledWorkout);
    await expect(
      updateWorkout('wo-1', { status: 'completed' }),
    ).rejects.toMatchObject({ code: 'UNPROCESSABLE' });
  });

  it('rejects Missed → Cancelled with 422', async () => {
    const missedWorkout = Object.assign({}, mockWorkoutRow, { status: 'Missed' }) as never;
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(missedWorkout);
    await expect(
      updateWorkout('wo-1', { status: 'cancelled' }),
    ).rejects.toMatchObject({ code: 'UNPROCESSABLE' });
  });

  it('allows Planned → Completed and calls repository', async () => {
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(mockWorkoutRow);
    vi.mocked(TrainingRepository.updatePlannedWorkout).mockResolvedValue(mockWorkoutRow);
    await updateWorkout('wo-1', { status: 'completed' });
    expect(TrainingRepository.updatePlannedWorkout).toHaveBeenCalledWith(
      'wo-1',
      expect.objectContaining({ status: 'Completed' }),
    );
  });

  it('allows Completed → Planned and calls repository', async () => {
    const completedWorkout = Object.assign({}, mockWorkoutRow, { status: 'Completed' }) as never;
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(completedWorkout);
    vi.mocked(TrainingRepository.updatePlannedWorkout).mockResolvedValue(mockWorkoutRow);
    await updateWorkout('wo-1', { status: 'planned' });
    expect(TrainingRepository.updatePlannedWorkout).toHaveBeenCalledWith(
      'wo-1',
      expect.objectContaining({ status: 'Planned' }),
    );
  });

  it('allows Cancelled → Planned and calls repository', async () => {
    const cancelledWorkout = Object.assign({}, mockWorkoutRow, { status: 'Cancelled' }) as never;
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(cancelledWorkout);
    vi.mocked(TrainingRepository.updatePlannedWorkout).mockResolvedValue(mockWorkoutRow);
    await updateWorkout('wo-1', { status: 'planned' });
    expect(TrainingRepository.updatePlannedWorkout).toHaveBeenCalledWith(
      'wo-1',
      expect.objectContaining({ status: 'Planned' }),
    );
  });
});

// ── plan-date alignment: createWorkout() ─────────────────────────────────────

describe('createWorkout() plan-date alignment', () => {
  beforeEach(() => vi.resetAllMocks());

  it('rejects scheduledDate before plan.startDate with 422', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(mockPlanRow);
    await expect(
      createWorkout({ ...minimalWorkoutInput, trainingPlanId: 'plan-1', scheduledDate: '2024-05-01' }),
    ).rejects.toMatchObject({ code: 'UNPROCESSABLE' });
  });

  it('rejects scheduledDate after plan.endDate with 422', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(mockPlanRow);
    await expect(
      createWorkout({ ...minimalWorkoutInput, trainingPlanId: 'plan-1', scheduledDate: '2024-09-01' }),
    ).rejects.toMatchObject({ code: 'UNPROCESSABLE' });
  });

  it('accepts scheduledDate within plan range', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(mockPlanRow);
    vi.mocked(TrainingRepository.createPlannedWorkout).mockResolvedValue(mockWorkoutRow);
    await expect(
      createWorkout({ ...minimalWorkoutInput, trainingPlanId: 'plan-1' }),
    ).resolves.not.toThrow();
  });

  it('accepts workout with no scheduledDate assigned to a plan', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(mockPlanRow);
    vi.mocked(TrainingRepository.createPlannedWorkout).mockResolvedValue(mockWorkoutRow);
    const { scheduledDate: _, ...inputWithoutDate } = minimalWorkoutInput;
    await expect(
      createWorkout({ ...inputWithoutDate, scheduledDate: undefined as never, trainingPlanId: 'plan-1' }),
    ).resolves.not.toThrow();
  });
});

// ── plan-date alignment: updateWorkout() ─────────────────────────────────────

describe('updateWorkout() plan-date alignment', () => {
  beforeEach(() => vi.resetAllMocks());

  const workoutWithPlan = Object.assign({}, mockWorkoutRow, {
    trainingPlanId: 'plan-1',
    scheduledDate: new Date('2024-06-10'),
  }) as never;

  it('rejects moving scheduledDate outside existing plan range with 422', async () => {
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(workoutWithPlan);
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(mockPlanRow);
    await expect(
      updateWorkout('wo-1', { scheduledDate: '2024-09-30' }),
    ).rejects.toMatchObject({ code: 'UNPROCESSABLE' });
  });

  it('rejects reassigning to a plan where existing date is out of range with 422', async () => {
    const otherPlan = Object.assign({}, mockPlanRow, {
      id: 'plan-2',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
    }) as never;
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(workoutWithPlan);
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(otherPlan);
    await expect(
      updateWorkout('wo-1', { trainingPlanId: 'plan-2' }),
    ).rejects.toMatchObject({ code: 'UNPROCESSABLE' });
  });

  it('accepts date update within the plan range', async () => {
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(workoutWithPlan);
    vi.mocked(TrainingRepository.findTrainingPlanById).mockResolvedValue(mockPlanRow);
    vi.mocked(TrainingRepository.updatePlannedWorkout).mockResolvedValue(mockWorkoutRow);
    await expect(updateWorkout('wo-1', { scheduledDate: '2024-07-01' })).resolves.not.toThrow();
  });

  it('accepts workout with no plan when date changes — no plan check needed', async () => {
    const workoutNoPlan = Object.assign({}, mockWorkoutRow, { trainingPlanId: null, scheduledDate: new Date('2024-06-10') }) as never;
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(workoutNoPlan);
    vi.mocked(TrainingRepository.updatePlannedWorkout).mockResolvedValue(mockWorkoutRow);
    await expect(updateWorkout('wo-1', { scheduledDate: '2024-07-01' })).resolves.not.toThrow();
    expect(TrainingRepository.findTrainingPlanById).not.toHaveBeenCalled();
  });

  it('skips date check when neither plan nor date is changing', async () => {
    vi.mocked(TrainingRepository.findWorkoutById).mockResolvedValue(workoutWithPlan);
    vi.mocked(TrainingRepository.updatePlannedWorkout).mockResolvedValue(mockWorkoutRow);
    await expect(updateWorkout('wo-1', { title: 'Renamed' })).resolves.not.toThrow();
    expect(TrainingRepository.findTrainingPlanById).not.toHaveBeenCalled();
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
