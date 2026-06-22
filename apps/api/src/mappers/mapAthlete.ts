import type { AthleteProfile, TrainingAvailability, TrainingGoal, TrainingZone } from '@prisma/client';
import type {
  AthleteProfileDto,
  TrainingAvailabilityDto,
  TrainingGoalDto,
  TrainingZoneDto,
  TrainingZoneSetDto,
} from '@pp-trainer/shared';

import type { ZoneSetWithZones } from '../repositories/AthleteRepository.js';
import {
  GOAL_PRIORITY_MAP,
  SPORT_TYPE_MAP,
  TRAINING_GOAL_TYPE_MAP,
  WEEKDAY_MAP,
  ZONE_TYPE_MAP,
  ZONE_UNIT_MAP,
} from './enumMaps.js';

export function mapAthleteProfile(profile: AthleteProfile): AthleteProfileDto {
  return {
    id: profile.id,
    displayName: profile.displayName,
    ...(profile.birthYear != null && { birthYear: profile.birthYear }),
    ...(profile.bodyWeightKg != null && { bodyWeightKg: Number(profile.bodyWeightKg) }),
    ...(profile.heightCm != null && { heightCm: profile.heightCm }),
    primarySports: profile.primarySports.map((s) => SPORT_TYPE_MAP[s]),
    thresholds: {
      ...(profile.currentFtpWatts != null && { currentFtpWatts: profile.currentFtpWatts }),
      ...(profile.maxHeartRateBpm != null && { maxHeartRateBpm: profile.maxHeartRateBpm }),
      ...(profile.restingHeartRateBpm != null && { restingHeartRateBpm: profile.restingHeartRateBpm }),
      ...(profile.runningThresholdPaceSecPerKm != null && {
        runningThresholdPaceSecPerKm: profile.runningThresholdPaceSecPerKm,
      }),
      ...(profile.swimmingThresholdPaceSecPer100m != null && {
        swimmingThresholdPaceSecPer100m: profile.swimmingThresholdPaceSecPer100m,
      }),
    },
    ...(profile.notes != null && { notes: profile.notes }),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function mapTrainingGoal(goal: TrainingGoal): TrainingGoalDto {
  return {
    id: goal.id,
    title: goal.title,
    goalType: TRAINING_GOAL_TYPE_MAP[goal.goalType],
    ...(goal.targetDate != null && { targetDate: goal.targetDate.toISOString().split('T')[0] }),
    ...(goal.sport != null && { sport: SPORT_TYPE_MAP[goal.sport] }),
    priority: GOAL_PRIORITY_MAP[goal.priority],
    ...(goal.targetDistanceMeters != null && { targetDistanceMeters: goal.targetDistanceMeters }),
    ...(goal.targetDurationSeconds != null && { targetDurationSeconds: goal.targetDurationSeconds }),
    ...(goal.targetPaceSecPerKm != null && { targetPaceSecPerKm: goal.targetPaceSecPerKm }),
    ...(goal.targetPowerWatts != null && { targetPowerWatts: goal.targetPowerWatts }),
    ...(goal.targetSwimPaceSecPer100m != null && {
      targetSwimPaceSecPer100m: goal.targetSwimPaceSecPer100m,
    }),
    ...(goal.description != null && { description: goal.description }),
    isActive: goal.isActive,
  };
}

export function mapTrainingAvailability(avail: TrainingAvailability): TrainingAvailabilityDto {
  return {
    weekday: WEEKDAY_MAP[avail.weekday],
    available: avail.available,
    ...(avail.maxDurationMinutes != null && { maxDurationMinutes: avail.maxDurationMinutes }),
    preferredSports: avail.preferredSports.map((s) => SPORT_TYPE_MAP[s]),
    ...(avail.notes != null && { notes: avail.notes }),
  };
}

function mapTrainingZone(zone: TrainingZone): TrainingZoneDto {
  return {
    id: zone.id,
    zoneNumber: zone.zoneNumber,
    name: zone.name,
    ...(zone.lowerBound != null && { lowerBound: zone.lowerBound }),
    ...(zone.upperBound != null && { upperBound: zone.upperBound }),
    unit: ZONE_UNIT_MAP[zone.unit],
    ...(zone.description != null && { description: zone.description }),
  };
}

export function mapTrainingZoneSet(zoneSet: ZoneSetWithZones): TrainingZoneSetDto {
  return {
    id: zoneSet.id,
    ...(zoneSet.sport != null && { sport: SPORT_TYPE_MAP[zoneSet.sport] }),
    zoneType: ZONE_TYPE_MAP[zoneSet.zoneType],
    name: zoneSet.name,
    ...(zoneSet.basedOn != null && { basedOn: zoneSet.basedOn }),
    isActive: zoneSet.isActive,
    zones: zoneSet.zones.map(mapTrainingZone),
  };
}
