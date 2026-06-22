import type { ImportedFile } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type ImportedFileWithCount = ImportedFile & {
  _count: { activities: number };
};

export async function findImportHistory(
  athleteProfileId: string,
): Promise<ImportedFileWithCount[]> {
  return prisma.importedFile.findMany({
    where: { athleteProfileId },
    include: { _count: { select: { activities: true } } },
    orderBy: { uploadedAt: 'desc' },
  });
}
