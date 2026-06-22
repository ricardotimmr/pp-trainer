import type { AthleteContextSnapshot } from '@prisma/client';
import type { AthleteContextSnapshotDto } from '@pp-trainer/shared';

export function mapAthleteContextSnapshot(
  snapshot: AthleteContextSnapshot,
): AthleteContextSnapshotDto {
  return {
    id: snapshot.id,
    contextVersion: snapshot.contextVersion,
    generatedAt: snapshot.generatedAt.toISOString(),
    ...(snapshot.goalSummary != null && { goalSummary: snapshot.goalSummary }),
    ...(snapshot.recentTrainingSummary != null && {
      recentTrainingSummary: snapshot.recentTrainingSummary,
    }),
    ...(snapshot.availabilitySummary != null && {
      availabilitySummary: snapshot.availabilitySummary,
    }),
    ...(snapshot.zoneSummary != null && { zoneSummary: snapshot.zoneSummary }),
    ...(snapshot.recoverySummary != null && { recoverySummary: snapshot.recoverySummary }),
  };
}
