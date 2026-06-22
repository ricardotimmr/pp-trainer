import type { ImportJob } from '@prisma/client';

import type { ImportPipelineResult } from '../../types.js';

export function buildResultStage(job: ImportJob): ImportPipelineResult {
  if (job.status === 'Success' && job.activityId != null) {
    return { status: 'success', activityId: job.activityId };
  }

  if (job.status === 'Duplicate' && job.activityId != null) {
    const reason =
      job.warningMessages.length > 0 ? job.warningMessages[0] : 'Duplicate activity detected';
    return { status: 'duplicate', activityId: job.activityId, reason };
  }

  return {
    status: 'failed',
    errorMessage: job.errorMessage ?? 'Import failed',
    ...(job.warningMessages.length > 0 && { warningMessages: job.warningMessages }),
  };
}
