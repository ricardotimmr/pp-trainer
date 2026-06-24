import type {
  AiCoachOutputDto,
  GenerateWeekPlanRequest,
  GenerateWorkoutRequest,
  PlannedWorkoutDto,
  TrainingPlanDto,
} from '@pp-trainer/shared';

import { apiFetch } from './apiClient';

export async function generateWeekPlan(data: GenerateWeekPlanRequest): Promise<AiCoachOutputDto> {
  return apiFetch<AiCoachOutputDto>('/api/ai/generate-week-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function generateWorkout(data: GenerateWorkoutRequest): Promise<AiCoachOutputDto> {
  return apiFetch<AiCoachOutputDto>('/api/ai/generate-workout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getOutput(id: string): Promise<AiCoachOutputDto> {
  return apiFetch<AiCoachOutputDto>(`/api/ai/outputs/${encodeURIComponent(id)}`);
}

export async function acceptOutput(id: string): Promise<TrainingPlanDto | PlannedWorkoutDto> {
  return apiFetch<TrainingPlanDto | PlannedWorkoutDto>(`/api/ai/outputs/${encodeURIComponent(id)}/accept`, {
    method: 'POST',
  });
}

export async function rejectOutput(id: string): Promise<void> {
  await apiFetch<{ success: true }>(`/api/ai/outputs/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
  });
}
