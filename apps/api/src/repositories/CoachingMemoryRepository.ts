import type { AiCoachOutputType, CoachingMemoryEntry } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

const RECENT_ENTRIES_LIMIT = 10;

export type CreateCoachingMemoryEntryData = {
  athleteProfileId: string;
  aiCoachOutputId?: string;
  outputType: AiCoachOutputType;
  entryText: string;
  weekStartDate?: string;
};

export async function createEntry(data: CreateCoachingMemoryEntryData): Promise<CoachingMemoryEntry> {
  return prisma.coachingMemoryEntry.create({
    data: {
      athleteProfileId: data.athleteProfileId,
      ...(data.aiCoachOutputId != null && { aiCoachOutputId: data.aiCoachOutputId }),
      outputType: data.outputType,
      entryText: data.entryText,
      ...(data.weekStartDate != null && { weekStartDate: data.weekStartDate }),
    },
  });
}

export async function findRecentEntries(athleteProfileId: string): Promise<CoachingMemoryEntry[]> {
  return prisma.coachingMemoryEntry.findMany({
    where: { athleteProfileId },
    orderBy: { createdAt: 'desc' },
    take: RECENT_ENTRIES_LIMIT,
  });
}

export async function countEntries(athleteProfileId: string): Promise<number> {
  return prisma.coachingMemoryEntry.count({ where: { athleteProfileId } });
}
