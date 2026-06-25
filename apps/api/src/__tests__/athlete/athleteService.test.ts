import type { AthleteProfile, TrainingGoal, TrainingZone } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ZoneSetWithZones } from '../../repositories/AthleteRepository.js';
import * as AthleteRepository from '../../repositories/AthleteRepository.js';
import {
  createGoal,
  createZone,
  createZoneSet,
  deleteGoal,
  deleteZone,
  deleteZoneSet,
  patchAthleteProfile,
  reorderGoals,
  updateGoal,
  updateZone,
  updateZoneSet,
} from '../../services/AthleteService.js';

vi.mock('../../lib/prisma.js', () => ({ prisma: {}, disconnectPrisma: vi.fn() }));
vi.mock('../../repositories/AthleteRepository.js');

const mockProfile = {
  id: 'profile-1',
  displayName: 'Test',
  primarySports: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
} as unknown as AthleteProfile;

const mockGoal = {
  id: 'goal-1',
  athleteProfileId: 'profile-1',
  title: 'Run a marathon',
  goalType: 'Race',
  targetDate: null,
  sport: null,
  priority: 'MainGoal',
  targetDistanceMeters: null,
  targetDurationSeconds: null,
  targetPaceSecPerKm: null,
  targetPowerWatts: null,
  targetSwimPaceSecPer100m: null,
  description: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as TrainingGoal;

const mockZoneSet = {
  id: 'zs-1',
  athleteProfileId: 'profile-1',
  sport: 'Cycling',
  zoneType: 'CyclingPower',
  name: 'Power Zones',
  basedOn: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  zones: [],
} as unknown as ZoneSetWithZones;

const mockZone = {
  id: 'zone-1',
  trainingZoneSetId: 'zs-1',
  zoneNumber: 1,
  name: 'Zone 1',
  lowerBound: null,
  upperBound: 150,
  unit: 'Watts',
  description: null,
} as unknown as TrainingZone;

beforeEach(() => {
  vi.resetAllMocks();
});

// ── patchAthleteProfile ───────────────────────────────────────────────────────

describe('patchAthleteProfile', () => {
  it('updates profile fields and returns mapped DTO', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    const updated = { ...mockProfile, displayName: 'Updated', primarySports: ['Cycling'] };
    vi.mocked(AthleteRepository.updateAthleteProfile).mockResolvedValue(updated as never);

    const result = await patchAthleteProfile({ displayName: 'Updated', primarySports: ['cycling'] });

    expect(AthleteRepository.updateAthleteProfile).toHaveBeenCalledWith(
      'profile-1',
      expect.objectContaining({ displayName: 'Updated', primarySports: ['Cycling'] }),
    );
    expect(result.displayName).toBe('Updated');
  });

  it('maps thresholds into flat profile fields', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(AthleteRepository.updateAthleteProfile).mockResolvedValue({ ...mockProfile, currentFtpWatts: 280 } as never);

    await patchAthleteProfile({ thresholds: { currentFtpWatts: 280 } });

    expect(AthleteRepository.updateAthleteProfile).toHaveBeenCalledWith(
      'profile-1',
      expect.objectContaining({ currentFtpWatts: 280 }),
    );
  });

  it('throws 404 when no profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    await expect(patchAthleteProfile({ displayName: 'X' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── createGoal ────────────────────────────────────────────────────────────────

describe('createGoal', () => {
  it('creates a goal and returns mapped DTO', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(AthleteRepository.createGoal).mockResolvedValue(mockGoal);

    const result = await createGoal({ title: 'Run a marathon', goalType: 'race', priority: 'main_goal' });

    expect(AthleteRepository.createGoal).toHaveBeenCalledWith(
      'profile-1',
      expect.objectContaining({ title: 'Run a marathon', goalType: 'Race', priority: 'MainGoal' }),
    );
    expect(result.title).toBe('Run a marathon');
    expect(result.priority).toBe('main_goal');
  });

  it('throws 404 when no profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    await expect(createGoal({ title: 'X', goalType: 'race', priority: 'main_goal' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── updateGoal ────────────────────────────────────────────────────────────────

describe('updateGoal', () => {
  it('updates a goal and returns mapped DTO', async () => {
    vi.mocked(AthleteRepository.findGoalById).mockResolvedValue(mockGoal);
    vi.mocked(AthleteRepository.updateGoal).mockResolvedValue({ ...mockGoal, title: 'Ultra' } as never);

    const result = await updateGoal('goal-1', { title: 'Ultra' });

    expect(AthleteRepository.updateGoal).toHaveBeenCalledWith('goal-1', expect.objectContaining({ title: 'Ultra' }));
    expect(result.title).toBe('Ultra');
  });

  it('throws 404 when goal not found', async () => {
    vi.mocked(AthleteRepository.findGoalById).mockResolvedValue(null);
    await expect(updateGoal('missing', { title: 'X' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── deleteGoal ────────────────────────────────────────────────────────────────

describe('deleteGoal', () => {
  it('deletes a goal', async () => {
    vi.mocked(AthleteRepository.findGoalById).mockResolvedValue(mockGoal);
    vi.mocked(AthleteRepository.deleteGoal).mockResolvedValue();

    await deleteGoal('goal-1');
    expect(AthleteRepository.deleteGoal).toHaveBeenCalledWith('goal-1');
  });

  it('throws 404 when goal not found', async () => {
    vi.mocked(AthleteRepository.findGoalById).mockResolvedValue(null);
    await expect(deleteGoal('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── reorderGoals ──────────────────────────────────────────────────────────────

describe('reorderGoals', () => {
  it('calls updateGoalPriorities with mapped enum values', async () => {
    vi.mocked(AthleteRepository.updateGoalPriorities).mockResolvedValue();

    await reorderGoals({ items: [{ id: 'goal-1', priority: 'main_goal' }] });

    expect(AthleteRepository.updateGoalPriorities).toHaveBeenCalledWith([
      { id: 'goal-1', priority: 'MainGoal' },
    ]);
  });
});

// ── createZoneSet ─────────────────────────────────────────────────────────────

describe('createZoneSet', () => {
  it('creates a zone set and returns mapped DTO', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(mockProfile);
    vi.mocked(AthleteRepository.createZoneSet).mockResolvedValue(mockZoneSet);

    const result = await createZoneSet({ zoneType: 'cycling_power', name: 'Power Zones', sport: 'cycling' });

    expect(AthleteRepository.createZoneSet).toHaveBeenCalledWith(
      'profile-1',
      expect.objectContaining({ zoneType: 'CyclingPower', name: 'Power Zones', sport: 'Cycling' }),
    );
    expect(result.name).toBe('Power Zones');
    expect(result.zoneType).toBe('cycling_power');
  });

  it('throws 404 when no profile exists', async () => {
    vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue(null);
    await expect(createZoneSet({ zoneType: 'heart_rate', name: 'HR' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── updateZoneSet ─────────────────────────────────────────────────────────────

describe('updateZoneSet', () => {
  it('updates a zone set', async () => {
    vi.mocked(AthleteRepository.findZoneSetById).mockResolvedValue(mockZoneSet);
    vi.mocked(AthleteRepository.updateZoneSet).mockResolvedValue({ ...mockZoneSet, name: 'Updated' } as never);

    const result = await updateZoneSet('zs-1', { name: 'Updated' });

    expect(AthleteRepository.updateZoneSet).toHaveBeenCalledWith('zs-1', expect.objectContaining({ name: 'Updated' }));
    expect(result.name).toBe('Updated');
  });

  it('throws 404 when zone set not found', async () => {
    vi.mocked(AthleteRepository.findZoneSetById).mockResolvedValue(null);
    await expect(updateZoneSet('missing', { name: 'X' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── deleteZoneSet ─────────────────────────────────────────────────────────────

describe('deleteZoneSet', () => {
  it('deletes a zone set', async () => {
    vi.mocked(AthleteRepository.findZoneSetById).mockResolvedValue(mockZoneSet);
    vi.mocked(AthleteRepository.deleteZoneSet).mockResolvedValue();

    await deleteZoneSet('zs-1');
    expect(AthleteRepository.deleteZoneSet).toHaveBeenCalledWith('zs-1');
  });

  it('throws 404 when zone set not found', async () => {
    vi.mocked(AthleteRepository.findZoneSetById).mockResolvedValue(null);
    await expect(deleteZoneSet('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── createZone ────────────────────────────────────────────────────────────────

describe('createZone', () => {
  it('creates a zone and returns mapped DTO', async () => {
    vi.mocked(AthleteRepository.findZoneSetById).mockResolvedValue(mockZoneSet);
    vi.mocked(AthleteRepository.createZone).mockResolvedValue(mockZone);

    const result = await createZone('zs-1', { zoneNumber: 1, name: 'Zone 1', unit: 'watts' });

    expect(AthleteRepository.createZone).toHaveBeenCalledWith(
      'zs-1',
      expect.objectContaining({ zoneNumber: 1, name: 'Zone 1', unit: 'Watts' }),
    );
    expect(result.name).toBe('Zone 1');
    expect(result.unit).toBe('watts');
  });

  it('throws 404 when zone set not found', async () => {
    vi.mocked(AthleteRepository.findZoneSetById).mockResolvedValue(null);
    await expect(createZone('missing', { zoneNumber: 1, name: 'Z', unit: 'bpm' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── updateZone ────────────────────────────────────────────────────────────────

describe('updateZone', () => {
  it('updates a zone', async () => {
    vi.mocked(AthleteRepository.findZoneById).mockResolvedValue(mockZone);
    vi.mocked(AthleteRepository.updateZone).mockResolvedValue({ ...mockZone, name: 'Updated Zone' } as never);

    const result = await updateZone('zone-1', { name: 'Updated Zone' });

    expect(AthleteRepository.updateZone).toHaveBeenCalledWith('zone-1', expect.objectContaining({ name: 'Updated Zone' }));
    expect(result.name).toBe('Updated Zone');
  });

  it('throws 404 when zone not found', async () => {
    vi.mocked(AthleteRepository.findZoneById).mockResolvedValue(null);
    await expect(updateZone('missing', { name: 'X' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── deleteZone ────────────────────────────────────────────────────────────────

describe('deleteZone', () => {
  it('deletes a zone', async () => {
    vi.mocked(AthleteRepository.findZoneById).mockResolvedValue(mockZone);
    vi.mocked(AthleteRepository.deleteZone).mockResolvedValue();

    await deleteZone('zone-1');
    expect(AthleteRepository.deleteZone).toHaveBeenCalledWith('zone-1');
  });

  it('throws 404 when zone not found', async () => {
    vi.mocked(AthleteRepository.findZoneById).mockResolvedValue(null);
    await expect(deleteZone('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
