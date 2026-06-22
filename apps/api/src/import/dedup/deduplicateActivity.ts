import type { ParsedActivity } from '../types.js';

export type DeduplicateResult =
  | { isDuplicate: false }
  | { isDuplicate: true; existingActivityId: string; reason: string };

// Implemented in P4-004.
// Checks:
//   1. Exact hash match via ImportedFile.fileHash / ImportJob.rawPayloadHash
//   2. Similarity: same sport + startTime ±60s + durationSeconds ±5%
export async function deduplicateActivity(
  _athleteProfileId: string,
  _parsed: ParsedActivity,
  _rawPayloadHash?: string,
): Promise<DeduplicateResult> {
  return { isDuplicate: false };
}
