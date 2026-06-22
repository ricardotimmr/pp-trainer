import { ImportNotImplementedError } from '../ActivityImporter.js';
import type { ParsedActivity } from '../types.js';

// Implemented in P4-003.
// Maps a ParsedActivity to the Prisma Activity create input shape,
// including sport-specific nested creates (laps, swimLaps, strengthSets, etc.).
export async function normalizeActivity(
  _athleteProfileId: string,
  _parsed: ParsedActivity,
): Promise<never> {
  throw new ImportNotImplementedError('normalizer');
}
