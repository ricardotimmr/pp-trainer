import type { DataSourceType, ImportedFile, ImportedFileType, ImportStatus, RawActivityData, RawDataFormat } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type CreateImportedFileInput = {
  athleteProfileId: string;
  sourceType: DataSourceType;
  fileName: string;
  fileType: ImportedFileType;
  fileSizeBytes: number;
  fileHash: string;
  importStatus: ImportStatus;
};

export async function createImportedFile(data: CreateImportedFileInput): Promise<ImportedFile> {
  return prisma.importedFile.create({ data });
}

export async function findImportedFileByHash(
  athleteProfileId: string,
  fileHash: string,
): Promise<ImportedFile | null> {
  return prisma.importedFile.findUnique({
    where: { athleteProfileId_fileHash: { athleteProfileId, fileHash } },
  });
}

export async function deleteImportedFile(id: string): Promise<void> {
  await prisma.importedFile.delete({ where: { id } });
}

export async function setCreatedActivityId(
  importedFileId: string,
  activityId: string,
): Promise<void> {
  await prisma.importedFile.update({
    where: { id: importedFileId },
    data: { createdActivityId: activityId },
  });
}

export type CreateRawActivityDataInput = {
  athleteProfileId: string;
  sourceType: DataSourceType;
  importedFileId: string;
  rawFormat: RawDataFormat;
  rawFilePath: string;
};

export async function createRawActivityData(
  data: CreateRawActivityDataInput,
): Promise<RawActivityData> {
  return prisma.rawActivityData.create({ data });
}
