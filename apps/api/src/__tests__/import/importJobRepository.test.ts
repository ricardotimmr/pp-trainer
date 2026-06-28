import type { ImportJob } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createImportJob,
  findImportJobById,
  findImportJobs,
  updateImportJob,
} from '../../repositories/ImportJobRepository.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    importJob: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
  disconnectPrisma: vi.fn(),
}));

const { prisma } = await import('../../lib/prisma.js');

const baseJob: ImportJob = {
  id: 'job-1',
  createdAt: new Date('2026-06-22T10:00:00Z'),
  updatedAt: new Date('2026-06-22T10:00:00Z'),
  athleteProfileId: 'profile-1',
  importedFileId: null,
  syncJobId: null,
  status: 'Pending',
  sourceType: 'ManualJsonImport',
  rawPayloadHash: null,
  activityId: null,
  errorMessage: null,
  warningMessages: [],
};

describe('ImportJobRepository', () => {
  beforeEach(() => vi.resetAllMocks());

  describe('createImportJob', () => {
    it('creates a job with Pending status', async () => {
      vi.mocked(prisma.importJob.create).mockResolvedValue(baseJob);

      const result = await createImportJob({
        athleteProfileId: 'profile-1',
        sourceType: 'ManualJsonImport',
      });

      expect(prisma.importJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          athleteProfileId: 'profile-1',
          sourceType: 'ManualJsonImport',
          status: 'Pending',
        }),
      });
      expect(result.id).toBe('job-1');
    });

    it('includes rawPayloadHash when provided', async () => {
      vi.mocked(prisma.importJob.create).mockResolvedValue({
        ...baseJob,
        rawPayloadHash: 'abc123',
      });

      await createImportJob({
        athleteProfileId: 'profile-1',
        sourceType: 'ManualJsonImport',
        rawPayloadHash: 'abc123',
      });

      expect(prisma.importJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ rawPayloadHash: 'abc123' }),
      });
    });

    it('includes importedFileId when provided', async () => {
      vi.mocked(prisma.importJob.create).mockResolvedValue({
        ...baseJob,
        importedFileId: 'file-1',
      });

      await createImportJob({
        athleteProfileId: 'profile-1',
        sourceType: 'ManualFitUpload',
        importedFileId: 'file-1',
      });

      expect(prisma.importJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ importedFileId: 'file-1' }),
      });
    });

    it('does not include rawPayloadHash when not provided', async () => {
      vi.mocked(prisma.importJob.create).mockResolvedValue(baseJob);

      await createImportJob({ athleteProfileId: 'profile-1', sourceType: 'ManualJsonImport' });

      const callArg = vi.mocked(prisma.importJob.create).mock.calls[0][0];
      expect('rawPayloadHash' in callArg.data).toBe(false);
    });
  });

  describe('findImportJobById', () => {
    it('returns the job when found', async () => {
      vi.mocked(prisma.importJob.findUnique).mockResolvedValue(baseJob);

      const result = await findImportJobById('job-1');

      expect(prisma.importJob.findUnique).toHaveBeenCalledWith({ where: { id: 'job-1' } });
      expect(result?.id).toBe('job-1');
    });

    it('returns null when not found', async () => {
      vi.mocked(prisma.importJob.findUnique).mockResolvedValue(null);

      const result = await findImportJobById('unknown');

      expect(result).toBeNull();
    });
  });

  describe('findImportJobs', () => {
    it('queries by athleteProfileId with default limit and offset', async () => {
      vi.mocked(prisma.importJob.findMany).mockResolvedValue([baseJob]);

      const result = await findImportJobs('profile-1');

      expect(prisma.importJob.findMany).toHaveBeenCalledWith({
        where: { athleteProfileId: 'profile-1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });
      expect(result).toHaveLength(1);
    });

    it('filters by status when provided', async () => {
      vi.mocked(prisma.importJob.findMany).mockResolvedValue([]);

      await findImportJobs('profile-1', { status: 'Failed' });

      expect(prisma.importJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { athleteProfileId: 'profile-1', status: 'Failed' } }),
      );
    });

    it('applies custom limit and offset', async () => {
      vi.mocked(prisma.importJob.findMany).mockResolvedValue([]);

      await findImportJobs('profile-1', { limit: 5, offset: 10 });

      expect(prisma.importJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, skip: 10 }),
      );
    });
  });

  describe('updateImportJob', () => {
    it('updates status', async () => {
      vi.mocked(prisma.importJob.update).mockResolvedValue({ ...baseJob, status: 'Processing' });

      const result = await updateImportJob('job-1', { status: 'Processing' });

      expect(prisma.importJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: expect.objectContaining({ status: 'Processing' }),
      });
      expect(result.status).toBe('Processing');
    });

    it('updates activityId and status together', async () => {
      vi.mocked(prisma.importJob.update).mockResolvedValue({
        ...baseJob,
        status: 'Success',
        activityId: 'act-1',
      });

      await updateImportJob('job-1', { status: 'Success', activityId: 'act-1' });

      expect(prisma.importJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: expect.objectContaining({ status: 'Success', activityId: 'act-1' }),
      });
    });

    it('does not include undefined fields in update data', async () => {
      vi.mocked(prisma.importJob.update).mockResolvedValue({ ...baseJob, status: 'Failed' });

      await updateImportJob('job-1', { status: 'Failed' });

      const callData = vi.mocked(prisma.importJob.update).mock.calls[0][0].data;
      expect('activityId' in callData).toBe(false);
      expect('errorMessage' in callData).toBe(false);
    });
  });
});
