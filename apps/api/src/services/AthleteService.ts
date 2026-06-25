import type { Weekday } from '@prisma/client';
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

import { ApiError } from '../errors/ApiError.js';
import {
  DTO_TO_PRISMA_GOAL_PRIORITY_MAP,
  DTO_TO_PRISMA_SPORT_MAP,
  DTO_TO_PRISMA_TRAINING_GOAL_TYPE_MAP,
  DTO_TO_PRISMA_ZONE_TYPE_MAP,
  DTO_TO_PRISMA_ZONE_UNIT_MAP,
} from '../mappers/enumMaps.js';
import {
  mapAthleteProfile,
  mapTrainingAvailability,
  mapTrainingGoal,
  mapTrainingZone,
  mapTrainingZoneSet,
} from '../mappers/mapAthlete.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';

const WEEKDAY_ORDER: Record<Weekday, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

export async function getAthleteSettings(): Promise<AthleteSettingsDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();

  if (!profile) {
    throw ApiError.notFound('Athlete profile not found');
  }

  const [goals, availability, zoneSets] = await Promise.all([
    AthleteRepository.findAthleteGoals(profile.id),
    AthleteRepository.findAthleteAvailability(profile.id),
    AthleteRepository.findAthleteZoneSets(profile.id),
  ]);

  const sortedAvailability = [...availability].sort(
    (a, b) => WEEKDAY_ORDER[a.weekday] - WEEKDAY_ORDER[b.weekday],
  );

  return {
    athleteProfile: mapAthleteProfile(profile),
    goals: goals.map(mapTrainingGoal),
    availability: sortedAvailability.map(mapTrainingAvailability),
    trainingZoneSets: zoneSets.map(mapTrainingZoneSet),
  };
}

// ── Athlete profile write ─────────────────────────────────────────────────────

export async function patchAthleteProfile(input: PatchAthleteProfileInput): Promise<AthleteProfileDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) throw ApiError.notFound('Athlete profile not found');

  const { thresholds, primarySports, ...rest } = input;

  const updated = await AthleteRepository.updateAthleteProfile(profile.id, {
    ...rest,
    ...(primarySports !== undefined && {
      primarySports: primarySports.map((s) => DTO_TO_PRISMA_SPORT_MAP[s]),
    }),
    ...(thresholds !== undefined && {
      currentFtpWatts: thresholds.currentFtpWatts,
      maxHeartRateBpm: thresholds.maxHeartRateBpm,
      restingHeartRateBpm: thresholds.restingHeartRateBpm,
      runningThresholdPaceSecPerKm: thresholds.runningThresholdPaceSecPerKm,
      swimmingThresholdPaceSecPer100m: thresholds.swimmingThresholdPaceSecPer100m,
    }),
  });

  return mapAthleteProfile(updated);
}

// ── Goal write ────────────────────────────────────────────────────────────────

async function requireGoal(id: string) {
  const goal = await AthleteRepository.findGoalById(id);
  if (!goal) throw ApiError.notFound('Goal not found');
  return goal;
}

export async function createGoal(input: CreateGoalInput): Promise<TrainingGoalDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) throw ApiError.notFound('Athlete profile not found');

  const goal = await AthleteRepository.createGoal(profile.id, {
    title: input.title,
    goalType: DTO_TO_PRISMA_TRAINING_GOAL_TYPE_MAP[input.goalType],
    ...(input.targetDate !== undefined && { targetDate: new Date(input.targetDate) }),
    ...(input.sport !== undefined && { sport: DTO_TO_PRISMA_SPORT_MAP[input.sport] }),
    priority: DTO_TO_PRISMA_GOAL_PRIORITY_MAP[input.priority],
    targetDistanceMeters: input.targetDistanceMeters,
    targetDurationSeconds: input.targetDurationSeconds,
    targetPaceSecPerKm: input.targetPaceSecPerKm,
    targetPowerWatts: input.targetPowerWatts,
    targetSwimPaceSecPer100m: input.targetSwimPaceSecPer100m,
    description: input.description,
  });

  return mapTrainingGoal(goal);
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<TrainingGoalDto> {
  await requireGoal(id);

  const updated = await AthleteRepository.updateGoal(id, {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.goalType !== undefined && { goalType: DTO_TO_PRISMA_TRAINING_GOAL_TYPE_MAP[input.goalType] }),
    ...(input.targetDate !== undefined && { targetDate: new Date(input.targetDate) }),
    ...(input.sport !== undefined && { sport: DTO_TO_PRISMA_SPORT_MAP[input.sport] }),
    ...(input.priority !== undefined && { priority: DTO_TO_PRISMA_GOAL_PRIORITY_MAP[input.priority] }),
    targetDistanceMeters: input.targetDistanceMeters ?? null,
    targetDurationSeconds: input.targetDurationSeconds ?? null,
    targetPaceSecPerKm: input.targetPaceSecPerKm ?? null,
    targetPowerWatts: input.targetPowerWatts ?? null,
    targetSwimPaceSecPer100m: input.targetSwimPaceSecPer100m ?? null,
    ...(input.description !== undefined && { description: input.description }),
  });

  return mapTrainingGoal(updated);
}

export async function deleteGoal(id: string): Promise<void> {
  await requireGoal(id);
  await AthleteRepository.deleteGoal(id);
}

export async function reorderGoals(input: ReorderGoalsInput): Promise<void> {
  await AthleteRepository.updateGoalPriorities(
    input.items.map(({ id, priority }) => ({
      id,
      priority: DTO_TO_PRISMA_GOAL_PRIORITY_MAP[priority],
    })),
  );
}

// ── Zone set write ────────────────────────────────────────────────────────────

async function requireZoneSet(id: string) {
  const set = await AthleteRepository.findZoneSetById(id);
  if (!set) throw ApiError.notFound('Training zone set not found');
  return set;
}

export async function createZoneSet(input: CreateZoneSetInput): Promise<TrainingZoneSetDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) throw ApiError.notFound('Athlete profile not found');

  const created = await AthleteRepository.createZoneSet(profile.id, {
    ...(input.sport !== undefined && { sport: DTO_TO_PRISMA_SPORT_MAP[input.sport] }),
    zoneType: DTO_TO_PRISMA_ZONE_TYPE_MAP[input.zoneType],
    name: input.name,
    basedOn: input.basedOn,
  });

  return mapTrainingZoneSet(created);
}

export async function updateZoneSet(id: string, input: UpdateZoneSetInput): Promise<TrainingZoneSetDto> {
  await requireZoneSet(id);

  const updated = await AthleteRepository.updateZoneSet(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.basedOn !== undefined && { basedOn: input.basedOn }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
  });

  return mapTrainingZoneSet(updated);
}

export async function deleteZoneSet(id: string): Promise<void> {
  await requireZoneSet(id);
  await AthleteRepository.deleteZoneSet(id);
}

// ── Zone write ────────────────────────────────────────────────────────────────

async function requireZone(id: string) {
  const zone = await AthleteRepository.findZoneById(id);
  if (!zone) throw ApiError.notFound('Training zone not found');
  return zone;
}

export async function createZone(setId: string, input: CreateZoneInput): Promise<TrainingZoneDto> {
  await requireZoneSet(setId);

  const created = await AthleteRepository.createZone(setId, {
    zoneNumber: input.zoneNumber,
    name: input.name,
    lowerBound: input.lowerBound,
    upperBound: input.upperBound,
    unit: DTO_TO_PRISMA_ZONE_UNIT_MAP[input.unit],
    description: input.description,
  });

  return mapTrainingZone(created);
}

export async function updateZone(id: string, input: UpdateZoneInput): Promise<TrainingZoneDto> {
  await requireZone(id);

  const updated = await AthleteRepository.updateZone(id, {
    ...(input.zoneNumber !== undefined && { zoneNumber: input.zoneNumber }),
    ...(input.name !== undefined && { name: input.name }),
    ...(input.lowerBound !== undefined && { lowerBound: input.lowerBound }),
    ...(input.upperBound !== undefined && { upperBound: input.upperBound }),
    ...(input.unit !== undefined && { unit: DTO_TO_PRISMA_ZONE_UNIT_MAP[input.unit] }),
    ...(input.description !== undefined && { description: input.description }),
  });

  return mapTrainingZone(updated);
}

export async function deleteZone(id: string): Promise<void> {
  await requireZone(id);
  await AthleteRepository.deleteZone(id);
}

// ── Availability write ────────────────────────────────────────────────────────

export async function updateAvailabilityDay(
  weekday: string,
  input: UpsertAvailabilityDayInput,
): Promise<TrainingAvailabilityDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) throw ApiError.notFound('Athlete profile not found');

  const updated = await AthleteRepository.upsertAvailabilityDay(profile.id, weekday, {
    ...(input.available !== undefined && { available: input.available }),
    ...(input.maxDurationMinutes !== undefined && { maxDurationMinutes: input.maxDurationMinutes }),
    ...(input.preferredSports !== undefined && {
      preferredSports: input.preferredSports.map((s) => DTO_TO_PRISMA_SPORT_MAP[s]),
    }),
    ...(input.notes !== undefined && { notes: input.notes }),
  });

  return mapTrainingAvailability(updated);
}
