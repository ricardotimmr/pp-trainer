import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    importedFile: { create: vi.fn() },
    rawActivityData: { create: vi.fn() },
  },
  disconnectPrisma: vi.fn(),
}));

const { prisma } = await import('../../lib/prisma.js');
const { createImportedFile, createRawActivityData } = await import(
  '../../repositories/ImportedFileRepository.js'
);

const mockPrisma = prisma as unknown as {
  importedFile: { create: ReturnType<typeof vi.fn> };
  rawActivityData: { create: ReturnType<typeof vi.fn> };
};

const baseFile = {
  id: 'file-1',
  athleteProfileId: 'profile-1',
  sourceType: 'ManualFitUpload' as const,
  fileName: 'activity.fit',
  fileType: 'Fit' as const,
  fileSizeBytes: 4096,
  fileHash: 'abc123',
  importStatus: 'Processing' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseRaw = {
  id: 'raw-1',
  athleteProfileId: 'profile-1',
  sourceType: 'ManualFitUpload' as const,
  importedFileId: 'file-1',
  rawFormat: 'Fit' as const,
  rawFilePath: '/storage/imports/uuid.fit',
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createImportedFile', () => {
  it('calls prisma.importedFile.create with the provided data', async () => {
    mockPrisma.importedFile.create.mockResolvedValueOnce(baseFile);

    const input = {
      athleteProfileId: 'profile-1',
      sourceType: 'ManualFitUpload' as const,
      fileName: 'activity.fit',
      fileType: 'Fit' as const,
      fileSizeBytes: 4096,
      fileHash: 'abc123',
      importStatus: 'Processing' as const,
    };

    const result = await createImportedFile(input);

    expect(mockPrisma.importedFile.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(baseFile);
  });

  it('returns the created ImportedFile record', async () => {
    mockPrisma.importedFile.create.mockResolvedValueOnce(baseFile);
    const result = await createImportedFile({
      athleteProfileId: 'profile-1',
      sourceType: 'ManualGpxUpload',
      fileName: 'run.gpx',
      fileType: 'Gpx',
      fileSizeBytes: 2048,
      fileHash: 'def456',
      importStatus: 'Processing',
    });
    expect(result.id).toBe('file-1');
  });
});

describe('createRawActivityData', () => {
  it('calls prisma.rawActivityData.create with the provided data', async () => {
    mockPrisma.rawActivityData.create.mockResolvedValueOnce(baseRaw);

    const input = {
      athleteProfileId: 'profile-1',
      sourceType: 'ManualFitUpload' as const,
      importedFileId: 'file-1',
      rawFormat: 'Fit' as const,
      rawFilePath: '/storage/imports/uuid.fit',
    };

    const result = await createRawActivityData(input);

    expect(mockPrisma.rawActivityData.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(baseRaw);
  });

  it('returns the created RawActivityData record', async () => {
    mockPrisma.rawActivityData.create.mockResolvedValueOnce(baseRaw);
    const result = await createRawActivityData({
      athleteProfileId: 'profile-1',
      sourceType: 'ManualTcxUpload',
      importedFileId: 'file-1',
      rawFormat: 'Tcx',
      rawFilePath: '/storage/imports/uuid.tcx',
    });
    expect(result.id).toBe('raw-1');
  });
});
