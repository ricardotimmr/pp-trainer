import type { ImportHistoryItemDto } from '@pp-trainer/shared';

import type { ImportedFileWithCount } from '../repositories/ImportRepository.js';
import { DATA_SOURCE_TYPE_MAP, IMPORT_STATUS_MAP, IMPORTED_FILE_TYPE_MAP } from './enumMaps.js';

export function mapImportHistoryItem(file: ImportedFileWithCount): ImportHistoryItemDto {
  return {
    id: file.id,
    sourceType: DATA_SOURCE_TYPE_MAP[file.sourceType],
    fileName: file.fileName,
    fileType: IMPORTED_FILE_TYPE_MAP[file.fileType],
    ...(file.fileSizeBytes != null && { fileSizeBytes: file.fileSizeBytes }),
    importStatus: IMPORT_STATUS_MAP[file.importStatus],
    ...(file.errorMessage != null && { errorMessage: file.errorMessage }),
    activityCount: file._count.activities,
    uploadedAt: file.uploadedAt.toISOString(),
    ...(file.processedAt != null && { processedAt: file.processedAt.toISOString() }),
  };
}
