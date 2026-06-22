import type { AthleteProfile, TrainingAvailability, TrainingGoal, TrainingZone, TrainingZoneSet } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type ZoneSetWithZones = TrainingZoneSet & { zones: TrainingZone[] };

export async function findFirstAthleteProfile(): Promise<AthleteProfile | null> {
  return prisma.athleteProfile.findFirst();
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
