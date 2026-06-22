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
