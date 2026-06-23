import type { DataSourceType } from '@prisma/client';

import * as ImportedFileRepository from '../../repositories/ImportedFileRepository.js';
import * as ImportJobService from '../../services/ImportJobService.js';
import { ImportNotImplementedError } from '../ActivityImporter.js';
import type { ImportPipelineContext, ImportPipelineResult, ImportSourceType } from '../types.js';
import { buildResultStage } from './stages/buildResultStage.js';
import { deduplicateStage } from './stages/deduplicateStage.js';
import { normalizeStage } from './stages/normalizeStage.js';
import { parseStage } from './stages/parseStage.js';
import { storeActivityStage } from './stages/storeActivityStage.js';
import { storeRawStage } from './stages/storeRawStage.js';
import { validateStage } from './stages/validateStage.js';

export type RunImportPipelineParams = {
  athleteProfileId: string;
  source: ImportSourceType;
  input: unknown;
  rawPayloadHash?: string;
  importedFileId?: string;
  forceImport?: boolean;
};

export async function runImportPipeline(
  params: RunImportPipelineParams,
): Promise<ImportPipelineResult> {
  const { athleteProfileId, source, input, rawPayloadHash, importedFileId, forceImport } = params;

  const job = await ImportJobService.startJob({
    athleteProfileId,
    sourceType: source as DataSourceType,
    rawPayloadHash,
    importedFileId,
  });

  const context: ImportPipelineContext = {
    athleteProfileId,
    importJobId: job.id,
    rawPayloadHash,
    importedFileId,
  };

  try {
    // 1. validate
    validateStage({ source, input });

    // 2. parse
    const parsed = await parseStage(source, input);

    // 3. store raw
    await storeRawStage({ context, source, rawInput: input });

    // 4. normalize
    const normalized = await normalizeStage({ athleteProfileId, parsed });

    // 5. deduplicate (skipped when forceImport: true)
    if (forceImport !== true) {
      const dedup = await deduplicateStage({ athleteProfileId, parsed, rawPayloadHash });
      if (dedup.isDuplicate) {
        const updatedJob = await ImportJobService.markDuplicate(
          job.id,
          dedup.existingActivityId,
          [dedup.reason],
        );
        return buildResultStage(updatedJob);
      }
    }

    // 6. store activity
    const activity = await storeActivityStage({ athleteProfileId, normalized });

    // 7. complete
    const completedJob = await ImportJobService.completeJob(job.id, activity.id);

    // Link ImportedFile → Activity for future duplicate detection
    if (importedFileId != null) {
      await ImportedFileRepository.setCreatedActivityId(importedFileId, activity.id).catch(
        () => {},
      );
    }

    return buildResultStage(completedJob);
  } catch (error) {
    const message =
      error instanceof ImportNotImplementedError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unexpected import error';

    const failedJob = await ImportJobService.failJob(job.id, message);
    return buildResultStage(failedJob);
  }
}
