import type {
  CreatePlannedWorkoutRequest,
  CreateTrainingPlanRequest,
  CurrentTrainingPlanResponseDto,
  PlannedWorkoutDto,
  TrainingPlanDto,
  TrainingPlanSummaryDto,
  UpdatePlannedWorkoutRequest,
  UpdateTrainingPlanRequest,
  UpdateWorkoutStatusRequest,
} from '@pp-trainer/shared';

import { apiFetch } from './apiClient';

export async function fetchCurrentWeekPlan(): Promise<CurrentTrainingPlanResponseDto> {
  return apiFetch<CurrentTrainingPlanResponseDto>('/api/training-plans/current-week');
}

export async function fetchTrainingPlans(): Promise<TrainingPlanSummaryDto[]> {
  return apiFetch<TrainingPlanSummaryDto[]>('/api/training-plans');
}

export async function fetchTrainingPlanById(id: string): Promise<TrainingPlanDto> {
  return apiFetch<TrainingPlanDto>(`/api/training-plans/${encodeURIComponent(id)}`);
}

export async function createTrainingPlan(data: CreateTrainingPlanRequest): Promise<TrainingPlanDto> {
  return apiFetch<TrainingPlanDto>('/api/training-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateTrainingPlan(
  id: string,
  data: UpdateTrainingPlanRequest,
): Promise<TrainingPlanDto> {
  return apiFetch<TrainingPlanDto>(`/api/training-plans/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function fetchWorkouts(): Promise<PlannedWorkoutDto[]> {
  return apiFetch<PlannedWorkoutDto[]>('/api/workouts');
}

export async function fetchWorkoutsForWeek(from: string, to: string): Promise<PlannedWorkoutDto[]> {
  return apiFetch<PlannedWorkoutDto[]>(`/api/workouts?from=${from}&to=${to}`);
}

export async function fetchWorkoutById(id: string): Promise<PlannedWorkoutDto> {
  return apiFetch<PlannedWorkoutDto>(`/api/workouts/${encodeURIComponent(id)}`);
}

export async function createWorkout(
  data: CreatePlannedWorkoutRequest,
): Promise<PlannedWorkoutDto> {
  return apiFetch<PlannedWorkoutDto>('/api/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateWorkout(
  id: string,
  data: UpdatePlannedWorkoutRequest,
): Promise<PlannedWorkoutDto> {
  return apiFetch<PlannedWorkoutDto>(`/api/workouts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateWorkoutStatus(
  id: string,
  data: UpdateWorkoutStatusRequest,
): Promise<PlannedWorkoutDto> {
  return apiFetch<PlannedWorkoutDto>(`/api/workouts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteWorkout(id: string, options?: { force?: boolean }): Promise<void> {
  const params = new URLSearchParams();
  if (options?.force) params.set('force', 'true');
  const query = params.size > 0 ? `?${params.toString()}` : '';

  await apiFetch<void>(`/api/workouts/${encodeURIComponent(id)}${query}`, {
    method: 'DELETE',
    acceptedStatuses: [204],
  });
}

export async function linkWorkoutActivity(
  workoutId: string,
  activityId: string,
): Promise<PlannedWorkoutDto> {
  return apiFetch<PlannedWorkoutDto>(`/api/workouts/${encodeURIComponent(workoutId)}/link-activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activityId }),
  });
}

export async function unlinkWorkoutActivity(workoutId: string): Promise<PlannedWorkoutDto> {
  return apiFetch<PlannedWorkoutDto>(`/api/workouts/${encodeURIComponent(workoutId)}/link-activity`, {
    method: 'DELETE',
  });
}

export async function deleteTrainingPlan(id: string): Promise<void> {
  await apiFetch<void>(`/api/training-plans/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    acceptedStatuses: [204],
  });
}
