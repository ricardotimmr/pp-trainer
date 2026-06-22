import type { ImportedFile } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { mapImportHistoryItem } from '../../mappers/mapImport.js';
import type { ImportedFileWithCount } from '../../repositories/ImportRepository.js';

const baseFile: ImportedFile = {
  id: 'file-1',
  createdAt: new Date('2024-05-01T00:00:00Z'),
  updatedAt: new Date('2024-05-01T00:00:00Z'),
  athleteProfileId: 'profile-1',
  sourceType: 'ManualFitUpload',
  fileName: 'morning_run.fit',
  fileType: 'Fit',
  fileSizeBytes: 204800,
  fileHash: 'abc123',
  importStatus: 'Success',
  errorMessage: null,
  createdActivityId: 'act-1',
  uploadedAt: new Date('2024-05-01T08:00:00Z'),
  processedAt: new Date('2024-05-01T08:00:05Z'),
};

const baseFileWithCount: ImportedFileWithCount = {
  ...baseFile,
  _count: { activities: 1 },
};

describe('mapImportHistoryItem', () => {
  it('maps required fields', () => {
    const dto = mapImportHistoryItem(baseFileWithCount);
    expect(dto.id).toBe('file-1');
    expect(dto.fileName).toBe('morning_run.fit');
    expect(dto.activityCount).toBe(1);
  });

  it('maps DataSourceType enum values', () => {
    expect(mapImportHistoryItem({ ...baseFileWithCount, sourceType: 'ManualFitUpload' }).sourceType).toBe('manual_fit_upload');
    expect(mapImportHistoryItem({ ...baseFileWithCount, sourceType: 'ManualGpxUpload' }).sourceType).toBe('manual_gpx_upload');
    expect(mapImportHistoryItem({ ...baseFileWithCount, sourceType: 'GarminExport' }).sourceType).toBe('garmin_export');
    expect(mapImportHistoryItem({ ...baseFileWithCount, sourceType: 'Mock' }).sourceType).toBe('mock');
  });

  it('maps ImportedFileType enum values', () => {
    expect(mapImportHistoryItem({ ...baseFileWithCount, fileType: 'Fit' }).fileType).toBe('fit');
    expect(mapImportHistoryItem({ ...baseFileWithCount, fileType: 'Gpx' }).fileType).toBe('gpx');
    expect(mapImportHistoryItem({ ...baseFileWithCount, fileType: 'Tcx' }).fileType).toBe('tcx');
    expect(mapImportHistoryItem({ ...baseFileWithCount, fileType: 'Json' }).fileType).toBe('json');
    expect(mapImportHistoryItem({ ...baseFileWithCount, fileType: 'Csv' }).fileType).toBe('csv');
    expect(mapImportHistoryItem({ ...baseFileWithCount, fileType: 'Unknown' }).fileType).toBe('unknown');
  });

  it('maps ImportStatus enum values covering all statuses', () => {
    expect(mapImportHistoryItem({ ...baseFileWithCount, importStatus: 'Pending' }).importStatus).toBe('pending');
    expect(mapImportHistoryItem({ ...baseFileWithCount, importStatus: 'Processing' }).importStatus).toBe('processing');
    expect(mapImportHistoryItem({ ...baseFileWithCount, importStatus: 'Success' }).importStatus).toBe('success');
    expect(mapImportHistoryItem({ ...baseFileWithCount, importStatus: 'Failed' }).importStatus).toBe('failed');
    expect(mapImportHistoryItem({ ...baseFileWithCount, importStatus: 'Duplicate' }).importStatus).toBe('duplicate');
    expect(mapImportHistoryItem({ ...baseFileWithCount, importStatus: 'PartiallyImported' }).importStatus).toBe('partially_imported');
  });

  it('formats uploadedAt as ISO string', () => {
    const dto = mapImportHistoryItem(baseFileWithCount);
    expect(dto.uploadedAt).toBe('2024-05-01T08:00:00.000Z');
  });

  it('formats processedAt as ISO string when present', () => {
    const dto = mapImportHistoryItem(baseFileWithCount);
    expect(dto.processedAt).toBe('2024-05-01T08:00:05.000Z');
  });

  it('omits processedAt when null', () => {
    const dto = mapImportHistoryItem({ ...baseFileWithCount, processedAt: null });
    expect('processedAt' in dto).toBe(false);
  });

  it('includes fileSizeBytes when present', () => {
    const dto = mapImportHistoryItem(baseFileWithCount);
    expect(dto.fileSizeBytes).toBe(204800);
  });

  it('omits fileSizeBytes when null', () => {
    const dto = mapImportHistoryItem({ ...baseFileWithCount, fileSizeBytes: null });
    expect('fileSizeBytes' in dto).toBe(false);
  });

  it('includes errorMessage for failed imports', () => {
    const dto = mapImportHistoryItem({
      ...baseFileWithCount,
      importStatus: 'Failed',
      errorMessage: 'Unsupported FIT file version',
    });
    expect(dto.errorMessage).toBe('Unsupported FIT file version');
  });

  it('omits errorMessage when null (successful import)', () => {
    const dto = mapImportHistoryItem(baseFileWithCount);
    expect('errorMessage' in dto).toBe(false);
  });

  it('reflects activityCount from _count.activities', () => {
    expect(mapImportHistoryItem({ ...baseFileWithCount, _count: { activities: 0 } }).activityCount).toBe(0);
    expect(mapImportHistoryItem({ ...baseFileWithCount, _count: { activities: 3 } }).activityCount).toBe(3);
  });
});
