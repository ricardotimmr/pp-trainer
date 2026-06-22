import type { AthleteContextSnapshot } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import type { AthleteContextV1 } from '../types/athleteContext.js';

export type ContextSnapshotSummaries = {
  goalSummary?: string | null;
  recentTrainingSummary?: string | null;
  availabilitySummary?: string | null;
  zoneSummary?: string | null;
};

export async function saveAthleteContextSnapshot(
  athleteProfileId: string,
  context: AthleteContextV1,
  summaries: ContextSnapshotSummaries = {},
): Promise<AthleteContextSnapshot> {
  return prisma.athleteContextSnapshot.create({
    data: {
      athleteProfileId,
      contextVersion: context.version,
      generatedAt: new Date(context.generatedAt),
      structuredContext: context as unknown as Prisma.InputJsonValue,
      ...(summaries.goalSummary != null && { goalSummary: summaries.goalSummary }),
      ...(summaries.recentTrainingSummary != null && {
        recentTrainingSummary: summaries.recentTrainingSummary,
      }),
      ...(summaries.availabilitySummary != null && {
        availabilitySummary: summaries.availabilitySummary,
      }),
      ...(summaries.zoneSummary != null && { zoneSummary: summaries.zoneSummary }),
    },
  });
}
