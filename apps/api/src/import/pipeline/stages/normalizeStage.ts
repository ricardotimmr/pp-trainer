import { normalizeActivity, type NormalizedActivity } from '../../normalizer/ActivityNormalizer.js';
import type { ParsedActivity } from '../../types.js';

export type NormalizedActivityInput = {
  athleteProfileId: string;
  parsed: ParsedActivity;
};

export async function normalizeStage(input: NormalizedActivityInput): Promise<NormalizedActivity> {
  return normalizeActivity(input.athleteProfileId, input.parsed);
}
