import { ImportNotImplementedError } from '../../ActivityImporter.js';

// Implemented in P4-005 once ActivityNormalizer produces a Prisma write input.
export async function storeActivityStage(_input: {
  athleteProfileId: string;
  normalized: unknown;
}): Promise<{ id: string }> {
  throw new ImportNotImplementedError('storeActivity');
}
