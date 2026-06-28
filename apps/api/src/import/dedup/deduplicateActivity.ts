import type { DataSourceType } from '@prisma/client';
import type { SportTypeDto } from '@pp-trainer/shared';

import { DTO_TO_PRISMA_SPORT_MAP } from '../../mappers/enumMaps.js';
import * as ActivityRepository from '../../repositories/ActivityRepository.js';
import * as ImportJobRepository from '../../repositories/ImportJobRepository.js';
import type { ParsedActivity } from '../types.js';

export type DeduplicateResult =
  | { isDuplicate: false }
  | { isDuplicate: true; existingActivityId: string; reason: string };

export async function deduplicateActivity(
  athleteProfileId: string,
  parsed: ParsedActivity,
  rawPayloadHash?: string,
): Promise<DeduplicateResult> {
  // 1. External ID check — fastest path for recurring syncs of the same external activity
  if (parsed.externalId != null) {
    const existing = await ActivityRepository.findActivityByExternalId(
      athleteProfileId,
      parsed.source as DataSourceType,
      parsed.externalId,
    );
    if (existing != null) {
      return {
        isDuplicate: true,
        existingActivityId: existing.id,
        reason: `Exact duplicate: externalId '${parsed.externalId}' already imported from ${parsed.source}`,
      };
    }
  }

  // 2. Exact hash check
  if (rawPayloadHash != null) {
    const existing = await ImportJobRepository.findImportJobByHash(rawPayloadHash, athleteProfileId);
    if (existing?.activityId != null) {
      return {
        isDuplicate: true,
        existingActivityId: existing.activityId,
        reason: 'Exact duplicate: identical payload hash already imported',
      };
    }
  }

  // 3. Similarity check — same sport, startTime ±30s, duration ±5%
  const sport = DTO_TO_PRISMA_SPORT_MAP[parsed.sport as SportTypeDto];
  if (sport == null) {
    return { isDuplicate: false };
  }

  const similar = await ActivityRepository.findSimilarActivity({
    athleteProfileId,
    sport,
    startTime: parsed.startTime,
    durationSeconds: parsed.durationSeconds,
  });

  if (similar != null) {
    return {
      isDuplicate: true,
      existingActivityId: similar.id,
      reason: 'Probable duplicate matched by startTime, sport and duration',
    };
  }

  return { isDuplicate: false };
}
