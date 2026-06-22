import { deduplicateActivity, type DeduplicateResult } from '../../dedup/deduplicateActivity.js';
import type { ParsedActivity } from '../../types.js';

export type DeduplicateStageInput = {
  athleteProfileId: string;
  parsed: ParsedActivity;
  rawPayloadHash?: string;
};

export async function deduplicateStage(input: DeduplicateStageInput): Promise<DeduplicateResult> {
  return deduplicateActivity(input.athleteProfileId, input.parsed, input.rawPayloadHash);
}
