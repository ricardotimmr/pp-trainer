import type { DataSourceType } from '@prisma/client';

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
};

/**
 * Import pipeline orchestrator.
 *
 * Stages:
 *   1. validate  — schema/type check (pass-through until parsers implement it)
 *   2. parse     — source-specific parser → ParsedActivity
 *   3. store-raw — persist ImportedFile + RawActivityData before normalization
 *   4. normalize — ParsedActivity → Prisma Activity write shape
 *   5. dedup     — hash + similarity check; short-circuits on duplicate
 *   6. store     — write Activity + relations to DB
 *   7. complete  — update ImportJob to success with activityId
 *
 * Any stage that throws ImportNotImplementedError causes the job to fail with
 * a clear 'not_implemented' message. Other errors are caught and stored as
 * errorMessage on the ImportJob.
 */
export async function runImportPipeline(
  params: RunImportPipelineParams,
): Promise<ImportPipelineResult> {
  const { athleteProfileId, source, input, rawPayloadHash, importedFileId } = params;

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

    // 5. deduplicate
    const dedup = await deduplicateStage({ athleteProfileId, rawPayloadHash });
    if (dedup.isDuplicate) {
      // deduplicateStage will return the existingActivityId once implemented (P4-004)
      const updatedJob = await ImportJobService.markDuplicate(job.id, '');
      return buildResultStage(updatedJob);
    }

    // 6. store activity
    const activity = await storeActivityStage({ athleteProfileId, normalized });

    // 7. complete
    const completedJob = await ImportJobService.completeJob(job.id, activity.id);
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
