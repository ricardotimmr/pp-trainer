import { prisma } from '../../../lib/prisma.js';
import type { NormalizedActivity } from '../../normalizer/ActivityNormalizer.js';

export async function storeActivityStage(_input: {
  athleteProfileId: string;
  normalized: NormalizedActivity;
}): Promise<{ id: string }> {
  return prisma.activity.create({
    data: _input.normalized,
    select: { id: true },
  });
}
