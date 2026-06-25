import type {
  AthleteProfileDto,
  AthleteSettingsDto,
  CreateGoalInput,
  CreateZoneInput,
  CreateZoneSetInput,
  PatchAthleteProfileInput,
  ReorderGoalsInput,
  TrainingAvailabilityDto,
  TrainingGoalDto,
  TrainingZoneDto,
  TrainingZoneSetDto,
  UpdateGoalInput,
  UpdateZoneInput,
  UpdateZoneSetInput,
  UpsertAvailabilityDayInput,
} from '@pp-trainer/shared';

import { apiFetch } from './apiClient';

// ── Read ──────────────────────────────────────────────────────────────────────

export async function fetchAthleteSettings(): Promise<AthleteSettingsDto> {
  return apiFetch<AthleteSettingsDto>('/api/athlete/profile');
}

// ── Profile write ──────────────────────────────────────────────────────────────

export async function patchAthleteProfile(
  input: PatchAthleteProfileInput,
): Promise<AthleteProfileDto> {
  return apiFetch<AthleteProfileDto>('/api/athlete/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

// ── Goal write ────────────────────────────────────────────────────────────────

export async function createGoal(input: CreateGoalInput): Promise<TrainingGoalDto> {
  return apiFetch<TrainingGoalDto>('/api/athlete/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<TrainingGoalDto> {
  return apiFetch<TrainingGoalDto>(`/api/athlete/goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteGoal(id: string): Promise<void> {
  return apiFetch<void>(`/api/athlete/goals/${id}`, {
    method: 'DELETE',
    acceptedStatuses: [204],
  });
}

export async function reorderGoals(input: ReorderGoalsInput): Promise<void> {
  return apiFetch<void>('/api/athlete/goals/priority', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    acceptedStatuses: [204],
  });
}

// ── Availability write ─────────────────────────────────────────────────────────

export async function patchAvailabilityDay(
  weekday: string,
  input: UpsertAvailabilityDayInput,
): Promise<TrainingAvailabilityDto> {
  return apiFetch<TrainingAvailabilityDto>(`/api/athlete/availability/${weekday}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function recalculateZones(): Promise<void> {
  return apiFetch<void>('/api/athlete/zones/recalculate', {
    method: 'POST',
    acceptedStatuses: [204],
  });
}

// ── Zone set write ─────────────────────────────────────────────────────────────

export async function createZoneSet(input: CreateZoneSetInput): Promise<TrainingZoneSetDto> {
  return apiFetch<TrainingZoneSetDto>('/api/training-zones/sets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateZoneSet(
  id: string,
  input: UpdateZoneSetInput,
): Promise<TrainingZoneSetDto> {
  return apiFetch<TrainingZoneSetDto>(`/api/training-zones/sets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteZoneSet(id: string): Promise<void> {
  return apiFetch<void>(`/api/training-zones/sets/${id}`, {
    method: 'DELETE',
    acceptedStatuses: [204],
  });
}

// ── Zone write ─────────────────────────────────────────────────────────────────

export async function createZone(
  setId: string,
  input: CreateZoneInput,
): Promise<TrainingZoneDto> {
  return apiFetch<TrainingZoneDto>(`/api/training-zones/sets/${setId}/zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateZone(id: string, input: UpdateZoneInput): Promise<TrainingZoneDto> {
  return apiFetch<TrainingZoneDto>(`/api/training-zones/zones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteZone(id: string): Promise<void> {
  return apiFetch<void>(`/api/training-zones/zones/${id}`, {
    method: 'DELETE',
    acceptedStatuses: [204],
  });
}
