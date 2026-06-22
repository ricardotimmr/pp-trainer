import { ImportNotImplementedError } from '../../ActivityImporter.js';
import type { ParsedActivity } from '../../types.js';

export type NormalizedActivityInput = {
  athleteProfileId: string;
  parsed: ParsedActivity;
};

// Implemented in P4-003 via ActivityNormalizer.
export async function normalizeStage(_input: NormalizedActivityInput): Promise<never> {
  throw new ImportNotImplementedError('normalizer');
}
