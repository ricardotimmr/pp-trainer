import type {
  AiCoachOutputDto,
  AcceptAiOutputRequest,
  GenerateWeekAnalysisRequest,
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

export async function generateWeekAnalysis(data: GenerateWeekAnalysisRequest = {}): Promise<AiCoachOutputDto> {
  return apiFetch<AiCoachOutputDto>('/api/ai/generate-week-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getOutput(id: string): Promise<AiCoachOutputDto> {
  return apiFetch<AiCoachOutputDto>(`/api/ai/outputs/${encodeURIComponent(id)}`);
}

export async function acceptOutput(
  id: string,
  data: AcceptAiOutputRequest = {},
): Promise<TrainingPlanDto | PlannedWorkoutDto | AiCoachOutputDto> {
  return apiFetch<TrainingPlanDto | PlannedWorkoutDto | AiCoachOutputDto>(`/api/ai/outputs/${encodeURIComponent(id)}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function rejectOutput(id: string): Promise<void> {
  await apiFetch<{ success: true }>(`/api/ai/outputs/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
  });
}

export async function fetchAiHistory(limit = 5): Promise<AiCoachOutputDto[]> {
  return apiFetch<AiCoachOutputDto[]>(`/api/ai/history?limit=${limit}`);
}
