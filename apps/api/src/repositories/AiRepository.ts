import type {
  AiCoachOutput,
  AiCoachOutputStatus,
  AiCoachOutputType,
  AiOutputValidationStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export type CreateAiCoachOutputData = {
  athleteProfileId: string;
  athleteContextSnapshotId?: string;
  outputType: AiCoachOutputType;
  status: AiCoachOutputStatus;
  validationStatus: AiOutputValidationStatus;
  summary?: string;
  structuredOutput?: unknown;
  validationErrors?: unknown;
};

export type UpdateAiCoachOutputData = {
  status?: AiCoachOutputStatus;
  validationStatus?: AiOutputValidationStatus;
  summary?: string;
  structuredOutput?: unknown;
  createdTrainingPlanId?: string;
  createdPlannedWorkoutId?: string;
};

export async function createOutput(data: CreateAiCoachOutputData): Promise<AiCoachOutput> {
  return prisma.aiCoachOutput.create({
    data: {
      athleteProfileId: data.athleteProfileId,
      ...(data.athleteContextSnapshotId != null && {
        athleteContextSnapshotId: data.athleteContextSnapshotId,
      }),
      outputType: data.outputType,
      status: data.status,
      validationStatus: data.validationStatus,
      ...(data.summary != null && { summary: data.summary }),
      ...(data.structuredOutput != null && {
        structuredOutput: data.structuredOutput as Prisma.InputJsonValue,
      }),
      ...(data.validationErrors != null && {
        validationErrors: data.validationErrors as Prisma.InputJsonValue,
      }),
    },
  });
}

export async function findOutput(id: string): Promise<AiCoachOutput | null> {
  return prisma.aiCoachOutput.findUnique({ where: { id } });
}

export async function findRecentOutputs(
  athleteProfileId: string,
  limit: number,
): Promise<AiCoachOutput[]> {
  return prisma.aiCoachOutput.findMany({
    where: { athleteProfileId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function updateOutput(
  id: string,
  data: UpdateAiCoachOutputData,
): Promise<AiCoachOutput> {
  return prisma.aiCoachOutput.update({
    where: { id },
    data: {
      ...(data.status != null && { status: data.status }),
      ...(data.validationStatus != null && { validationStatus: data.validationStatus }),
      ...(data.summary != null && { summary: data.summary }),
      ...(data.structuredOutput != null && {
        structuredOutput: data.structuredOutput as Prisma.InputJsonValue,
      }),
      ...(data.createdTrainingPlanId != null && { createdTrainingPlanId: data.createdTrainingPlanId }),
      ...(data.createdPlannedWorkoutId != null && { createdPlannedWorkoutId: data.createdPlannedWorkoutId }),
    },
  });
}
