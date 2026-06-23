import type { AiCoachOutputDto, GenerateWeekPlanRequest, GenerateWorkoutRequest } from '@pp-trainer/shared';

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
