import type { AiCoachOutput } from '@prisma/client';
import type { AiCoachOutputDto } from '@pp-trainer/shared';

import {
  AI_COACH_OUTPUT_STATUS_MAP,
  AI_COACH_OUTPUT_TYPE_MAP,
  AI_OUTPUT_VALIDATION_STATUS_MAP,
} from './enumMaps.js';

export function mapAiCoachOutput(output: AiCoachOutput): AiCoachOutputDto {
  return {
    id: output.id,
    outputType: AI_COACH_OUTPUT_TYPE_MAP[output.outputType],
    status: AI_COACH_OUTPUT_STATUS_MAP[output.status],
    validationStatus: AI_OUTPUT_VALIDATION_STATUS_MAP[output.validationStatus],
    ...(output.summary != null && { summary: output.summary }),
    ...(output.rawText != null && { rawText: output.rawText }),
    ...(output.structuredOutput != null && { structuredOutput: output.structuredOutput }),
    ...(output.createdTrainingPlanId != null && { createdTrainingPlanId: output.createdTrainingPlanId }),
    ...(output.createdPlannedWorkoutId != null && { createdPlannedWorkoutId: output.createdPlannedWorkoutId }),
    createdAt: output.createdAt.toISOString(),
  };
}
