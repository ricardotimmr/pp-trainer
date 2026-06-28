import type { ImportJob } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { mapImportDetail, mapImportSummary } from '../../mappers/mapImportJob.js';
import type { ImportJobWithFile } from '../../repositories/ImportJobRepository.js';

const baseJob: ImportJob = {
  id: 'job-1',
  createdAt: new Date('2026-06-22T10:00:00Z'),
  updatedAt: new Date('2026-06-22T10:01:00Z'),
  athleteProfileId: 'profile-1',
  importedFileId: null,
  syncJobId: null,
  status: 'Success',
  sourceType: 'ManualJsonImport',
  rawPayloadHash: 'abc123',
  activityId: 'act-1',
  errorMessage: null,
  warningMessages: [],
};

const baseJobWithFile: ImportJobWithFile = {
  ...baseJob,
  importedFile: null,
};

describe('mapImportSummary', () => {
  it('maps all required fields', () => {
    const result = mapImportSummary(baseJob);
    expect(result.id).toBe('job-1');
    expect(result.status).toBe('success');
    expect(result.sourceType).toBe('manual_json_import');
    expect(result.sourceLabel).toBe('JSON Import');
    expect(result.createdAt).toBe('2026-06-22T10:00:00.000Z');
    expect(result.activityId).toBe('act-1');
    expect(result.errorMessage).toBeNull();
  });

  it('maps null activityId', () => {
    const result = mapImportSummary({ ...baseJob, activityId: null });
    expect(result.activityId).toBeNull();
  });

  it('maps errorMessage when present', () => {
    const result = mapImportSummary({ ...baseJob, errorMessage: 'Parse failed' });
    expect(result.errorMessage).toBe('Parse failed');
  });

  describe('status mapping', () => {
    const statuses: Array<[ImportJob['status'], string]> = [
      ['Pending', 'pending'],
      ['Processing', 'processing'],
      ['Success', 'success'],
      ['Failed', 'failed'],
      ['Duplicate', 'duplicate'],
      ['PartiallyImported', 'partially_imported'],
    ];

    for (const [prisma, dto] of statuses) {
      it(`maps ${prisma} → ${dto}`, () => {
        const result = mapImportSummary({ ...baseJob, status: prisma });
        expect(result.status).toBe(dto);
      });
    }
  });

  describe('sourceType and sourceLabel mapping', () => {
    const sources: Array<[ImportJob['sourceType'], string, string]> = [
      ['ManualJsonImport', 'manual_json_import', 'JSON Import'],
      ['ManualFitUpload', 'manual_fit_upload', 'FIT Upload'],
      ['ManualGpxUpload', 'manual_gpx_upload', 'GPX Upload'],
      ['ManualTcxUpload', 'manual_tcx_upload', 'TCX Upload'],
      ['ManualCsvImport', 'manual_csv_import', 'CSV Import'],
    ];

    for (const [prisma, dtoType, label] of sources) {
      it(`maps ${prisma} → sourceType=${dtoType}, sourceLabel=${label}`, () => {
        const result = mapImportSummary({ ...baseJob, sourceType: prisma });
        expect(result.sourceType).toBe(dtoType);
        expect(result.sourceLabel).toBe(label);
      });
    }
  });
});

describe('mapImportDetail', () => {
  it('extends summary with detail fields', () => {
    const result = mapImportDetail(baseJobWithFile);
    expect(result.id).toBe('job-1');
    expect(result.status).toBe('success');
    expect(result.updatedAt).toBe('2026-06-22T10:01:00.000Z');
    expect(result.rawPayloadHash).toBe('abc123');
    expect(result.warningMessages).toEqual([]);
    expect(result.importedFile).toBeNull();
  });

  it('maps null rawPayloadHash', () => {
    const result = mapImportDetail({ ...baseJobWithFile, rawPayloadHash: null });
    expect(result.rawPayloadHash).toBeNull();
  });

  it('maps warningMessages', () => {
    const result = mapImportDetail({
      ...baseJobWithFile,
      warningMessages: ['Probable duplicate', 'Hash mismatch'],
    });
    expect(result.warningMessages).toEqual(['Probable duplicate', 'Hash mismatch']);
  });

  it('maps importedFile when present', () => {
    const jobWithFile: ImportJobWithFile = {
      ...baseJobWithFile,
      importedFile: {
        id: 'file-1',
        createdAt: new Date('2026-06-22T09:00:00Z'),
        updatedAt: new Date('2026-06-22T09:00:00Z'),
        athleteProfileId: 'profile-1',
        sourceType: 'ManualFitUpload',
        fileName: 'morning_run.fit',
        fileType: 'Fit',
        fileSizeBytes: 204800,
        fileHash: 'filehash123',
        importStatus: 'Success',
        errorMessage: null,
        createdActivityId: 'act-1',
        uploadedAt: new Date('2026-06-22T09:00:00Z'),
        processedAt: new Date('2026-06-22T09:00:05Z'),
      },
    };

    const result = mapImportDetail(jobWithFile);
    expect(result.importedFile).not.toBeNull();
    expect(result.importedFile!.id).toBe('file-1');
    expect(result.importedFile!.originalName).toBe('morning_run.fit');
    expect(result.importedFile!.fileSize).toBe(204800);
    expect(result.importedFile!.mimeType).toBe('application/octet-stream');
    expect(result.importedFile!.fileType).toBe('fit');
  });

  it('maps mime types for all file types', () => {
    const fileTypes: Array<[string, string]> = [
      ['Fit', 'application/octet-stream'],
      ['Gpx', 'application/gpx+xml'],
      ['Tcx', 'application/vnd.garmin.tcx+xml'],
      ['Json', 'application/json'],
      ['Csv', 'text/csv'],
    ];

    for (const [fileType, mimeType] of fileTypes) {
      const jobWithFile: ImportJobWithFile = {
        ...baseJobWithFile,
        importedFile: {
          id: 'file-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          athleteProfileId: 'profile-1',
          sourceType: 'ManualFitUpload',
          fileName: 'test.fit',
          fileType: fileType as never,
          fileSizeBytes: null,
          fileHash: null,
          importStatus: 'Success',
          errorMessage: null,
          createdActivityId: null,
          uploadedAt: new Date(),
          processedAt: null,
        },
      };
      const result = mapImportDetail(jobWithFile);
      expect(result.importedFile!.mimeType).toBe(mimeType);
    }
  });
});
