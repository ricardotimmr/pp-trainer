import type {
  AthleteProfile,
  GoalPriority,
  SportType,
  TrainingAvailability,
  TrainingGoal,
  TrainingGoalType,
  TrainingZone,
  TrainingZoneSet,
  TrainingZoneType,
  TrainingZoneUnit,
} from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type ZoneSetWithZones = TrainingZoneSet & { zones: TrainingZone[] };

// ── Read ─────────────────────────────────────────────────────────────────────

export async function findFirstAthleteProfile(): Promise<AthleteProfile | null> {
  return prisma.athleteProfile.findFirst();
}

export async function findAthleteProfileById(id: string): Promise<AthleteProfile | null> {
  return prisma.athleteProfile.findUnique({ where: { id } });
}

export async function findAthleteGoals(athleteProfileId: string): Promise<TrainingGoal[]> {
  return prisma.trainingGoal.findMany({
    where: { athleteProfileId, isActive: true },
    orderBy: [{ priority: 'asc' }, { targetDate: 'asc' }],
  });
}

export async function findAthleteAvailability(athleteProfileId: string): Promise<TrainingAvailability[]> {
  return prisma.trainingAvailability.findMany({
    where: { athleteProfileId },
  });
}

export async function findAthleteZoneSets(athleteProfileId: string): Promise<ZoneSetWithZones[]> {
  return prisma.trainingZoneSet.findMany({
    where: { athleteProfileId, isActive: true },
    include: { zones: { orderBy: { zoneNumber: 'asc' } } },
    orderBy: [{ sport: 'asc' }, { zoneType: 'asc' }],
  });
}

// ── Athlete profile write ────────────────────────────────────────────────────

export async function updateAthleteProfile(
  id: string,
  data: {
    displayName?: string;
    birthYear?: number;
    bodyWeightKg?: number;
    heightCm?: number;
    primarySports?: SportType[];
    currentFtpWatts?: number;
    maxHeartRateBpm?: number;
    restingHeartRateBpm?: number;
    runningThresholdPaceSecPerKm?: number;
    swimmingThresholdPaceSecPer100m?: number;
    notes?: string;
  },
): Promise<AthleteProfile> {
  return prisma.athleteProfile.update({ where: { id }, data });
}

// ── Goal write ───────────────────────────────────────────────────────────────

export async function findGoalById(id: string): Promise<TrainingGoal | null> {
  return prisma.trainingGoal.findUnique({ where: { id } });
}

export async function createGoal(
  athleteProfileId: string,
  data: {
    title: string;
    goalType: TrainingGoalType;
    targetDate?: Date;
    sport?: SportType;
    priority: GoalPriority;
    targetDistanceMeters?: number;
    targetDurationSeconds?: number;
    targetPaceSecPerKm?: number;
    targetPowerWatts?: number;
    targetSwimPaceSecPer100m?: number;
    description?: string;
  },
): Promise<TrainingGoal> {
  return prisma.trainingGoal.create({
    data: { athleteProfileId, ...data },
  });
}

export async function updateGoal(
  id: string,
  data: {
    title?: string;
    goalType?: TrainingGoalType;
    targetDate?: Date | null;
    sport?: SportType | null;
    priority?: GoalPriority;
    targetDistanceMeters?: number | null;
    targetDurationSeconds?: number | null;
    targetPaceSecPerKm?: number | null;
    targetPowerWatts?: number | null;
    targetSwimPaceSecPer100m?: number | null;
    description?: string | null;
  },
): Promise<TrainingGoal> {
  return prisma.trainingGoal.update({ where: { id }, data });
}

export async function deleteGoal(id: string): Promise<void> {
  await prisma.trainingGoal.delete({ where: { id } });
}

export async function updateGoalPriorities(
  items: { id: string; priority: GoalPriority }[],
): Promise<void> {
  await prisma.$transaction(
    items.map(({ id, priority }) =>
      prisma.trainingGoal.update({ where: { id }, data: { priority } }),
    ),
  );
}

// ── Zone set write ───────────────────────────────────────────────────────────

export async function findZoneSetById(id: string): Promise<ZoneSetWithZones | null> {
  return prisma.trainingZoneSet.findUnique({
    where: { id },
    include: { zones: { orderBy: { zoneNumber: 'asc' } } },
  });
}

export async function createZoneSet(
  athleteProfileId: string,
  data: { sport?: SportType; zoneType: TrainingZoneType; name: string; basedOn?: string },
): Promise<ZoneSetWithZones> {
  return prisma.trainingZoneSet.create({
    data: { athleteProfileId, ...data },
    include: { zones: { orderBy: { zoneNumber: 'asc' } } },
  });
}

export async function updateZoneSet(
  id: string,
  data: { name?: string; basedOn?: string | null; isActive?: boolean },
): Promise<ZoneSetWithZones> {
  return prisma.trainingZoneSet.update({
    where: { id },
    data,
    include: { zones: { orderBy: { zoneNumber: 'asc' } } },
  });
}

export async function deleteZoneSet(id: string): Promise<void> {
  await prisma.trainingZoneSet.delete({ where: { id } });
}

// ── Zone write ───────────────────────────────────────────────────────────────

export async function findZoneById(id: string): Promise<TrainingZone | null> {
  return prisma.trainingZone.findUnique({ where: { id } });
}

export async function createZone(
  trainingZoneSetId: string,
  data: {
    zoneNumber: number;
    name: string;
    lowerBound?: number;
    upperBound?: number;
    unit: TrainingZoneUnit;
    description?: string;
  },
): Promise<TrainingZone> {
  return prisma.trainingZone.create({ data: { trainingZoneSetId, ...data } });
}

export async function updateZone(
  id: string,
  data: {
    zoneNumber?: number;
    name?: string;
    lowerBound?: number | null;
    upperBound?: number | null;
    unit?: TrainingZoneUnit;
    description?: string | null;
  },
): Promise<TrainingZone> {
  return prisma.trainingZone.update({ where: { id }, data });
}

export async function deleteZone(id: string): Promise<void> {
  await prisma.trainingZone.delete({ where: { id } });
}
