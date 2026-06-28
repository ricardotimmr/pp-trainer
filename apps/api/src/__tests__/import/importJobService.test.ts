import type { ImportJob } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as ImportJobService from '../../services/ImportJobService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../repositories/ImportJobRepository.js', () => ({
  createImportJob: vi.fn(),
  findImportJobById: vi.fn(),
  findImportJobWithFile: vi.fn(),
  findImportJobs: vi.fn(),
  updateImportJob: vi.fn(),
}));

vi.mock('../../repositories/AthleteRepository.js', () => ({
  findFirstAthleteProfile: vi.fn(),
}));

const { createImportJob, findImportJobById, findImportJobs, updateImportJob } = await import(
  '../../repositories/ImportJobRepository.js'
);

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

describe('ImportJobService', () => {
  beforeEach(() => vi.resetAllMocks());

  describe('startJob', () => {
    it('creates a job and transitions it to Processing', async () => {
      vi.mocked(createImportJob).mockResolvedValue(baseJob);
      vi.mocked(updateImportJob).mockResolvedValue({ ...baseJob, status: 'Processing' });

      const result = await ImportJobService.startJob({
        athleteProfileId: 'profile-1',
        sourceType: 'ManualJsonImport',
      });

      expect(createImportJob).toHaveBeenCalledWith({
        athleteProfileId: 'profile-1',
        sourceType: 'ManualJsonImport',
      });
      expect(updateImportJob).toHaveBeenCalledWith('job-1', { status: 'Processing' });
      expect(result.status).toBe('Processing');
    });

    it('passes rawPayloadHash through to create', async () => {
      vi.mocked(createImportJob).mockResolvedValue(baseJob);
      vi.mocked(updateImportJob).mockResolvedValue({ ...baseJob, status: 'Processing' });

      await ImportJobService.startJob({
        athleteProfileId: 'profile-1',
        sourceType: 'ManualJsonImport',
        rawPayloadHash: 'abc123',
      });

      expect(createImportJob).toHaveBeenCalledWith(
        expect.objectContaining({ rawPayloadHash: 'abc123' }),
      );
    });

    it('passes importedFileId through to create', async () => {
      vi.mocked(createImportJob).mockResolvedValue(baseJob);
      vi.mocked(updateImportJob).mockResolvedValue({ ...baseJob, status: 'Processing' });

      await ImportJobService.startJob({
        athleteProfileId: 'profile-1',
        sourceType: 'ManualFitUpload',
        importedFileId: 'file-1',
      });

      expect(createImportJob).toHaveBeenCalledWith(
        expect.objectContaining({ importedFileId: 'file-1' }),
      );
    });
  });

  describe('completeJob', () => {
    it('marks job as Success with the given activityId', async () => {
      vi.mocked(updateImportJob).mockResolvedValue({
        ...baseJob,
        status: 'Success',
        activityId: 'act-1',
      });

      const result = await ImportJobService.completeJob('job-1', 'act-1');

      expect(updateImportJob).toHaveBeenCalledWith('job-1', {
        status: 'Success',
        activityId: 'act-1',
      });
      expect(result.status).toBe('Success');
      expect(result.activityId).toBe('act-1');
    });
  });

  describe('failJob', () => {
    it('marks job as Failed with an errorMessage', async () => {
      vi.mocked(updateImportJob).mockResolvedValue({
        ...baseJob,
        status: 'Failed',
        errorMessage: 'Parse error',
      });

      const result = await ImportJobService.failJob('job-1', 'Parse error');

      expect(updateImportJob).toHaveBeenCalledWith('job-1', {
        status: 'Failed',
        errorMessage: 'Parse error',
      });
      expect(result.status).toBe('Failed');
    });

    it('includes warningMessages when provided', async () => {
      vi.mocked(updateImportJob).mockResolvedValue({
        ...baseJob,
        status: 'Failed',
        errorMessage: 'err',
        warningMessages: ['warn1'],
      });

      await ImportJobService.failJob('job-1', 'err', ['warn1']);

      expect(updateImportJob).toHaveBeenCalledWith('job-1', {
        status: 'Failed',
        errorMessage: 'err',
        warningMessages: ['warn1'],
      });
    });

    it('does not include warningMessages when not provided', async () => {
      vi.mocked(updateImportJob).mockResolvedValue({ ...baseJob, status: 'Failed' });

      await ImportJobService.failJob('job-1', 'err');

      const callData = vi.mocked(updateImportJob).mock.calls[0][1];
      expect('warningMessages' in callData).toBe(false);
    });
  });

  describe('markDuplicate', () => {
    it('marks job as Duplicate with existing activityId', async () => {
      vi.mocked(updateImportJob).mockResolvedValue({
        ...baseJob,
        status: 'Duplicate',
        activityId: 'act-existing',
      });

      const result = await ImportJobService.markDuplicate('job-1', 'act-existing');

      expect(updateImportJob).toHaveBeenCalledWith('job-1', {
        status: 'Duplicate',
        activityId: 'act-existing',
      });
      expect(result.status).toBe('Duplicate');
    });

    it('includes warningMessages when provided', async () => {
      vi.mocked(updateImportJob).mockResolvedValue({
        ...baseJob,
        status: 'Duplicate',
        activityId: 'act-existing',
        warningMessages: ['possible duplicate'],
      });

      await ImportJobService.markDuplicate('job-1', 'act-existing', ['possible duplicate']);

      expect(updateImportJob).toHaveBeenCalledWith('job-1', {
        status: 'Duplicate',
        activityId: 'act-existing',
        warningMessages: ['possible duplicate'],
      });
    });

    it('does not include warningMessages when not provided', async () => {
      vi.mocked(updateImportJob).mockResolvedValue({ ...baseJob, status: 'Duplicate' });

      await ImportJobService.markDuplicate('job-1', 'act-existing');

      const callData = vi.mocked(updateImportJob).mock.calls[0][1];
      expect('warningMessages' in callData).toBe(false);
    });
  });

  describe('getJobById', () => {
    it('delegates to repository and returns the job', async () => {
      vi.mocked(findImportJobById).mockResolvedValue(baseJob);

      const result = await ImportJobService.getJobById('job-1');

      expect(findImportJobById).toHaveBeenCalledWith('job-1');
      expect(result?.id).toBe('job-1');
    });

    it('returns null when not found', async () => {
      vi.mocked(findImportJobById).mockResolvedValue(null);

      const result = await ImportJobService.getJobById('unknown');

      expect(result).toBeNull();
    });
  });

  describe('getJobs', () => {
    it('delegates to repository with filter', async () => {
      vi.mocked(findImportJobs).mockResolvedValue([baseJob]);

      const result = await ImportJobService.getJobs('profile-1', { status: 'Success', limit: 5 });

      expect(findImportJobs).toHaveBeenCalledWith('profile-1', { status: 'Success', limit: 5 });
      expect(result).toHaveLength(1);
    });

    it('passes empty filter by default', async () => {
      vi.mocked(findImportJobs).mockResolvedValue([]);

      await ImportJobService.getJobs('profile-1');

      expect(findImportJobs).toHaveBeenCalledWith('profile-1', {});
    });
  });
});
