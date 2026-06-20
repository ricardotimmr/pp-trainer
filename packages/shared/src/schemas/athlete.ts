import { z } from 'zod';

import {
  IdSchema,
  IsoDateStringSchema,
  IsoDateTimeStringSchema,
  NonNegativeIntegerSchema,
  NonNegativeNumberSchema,
} from './common.js';
import {
  GoalPrioritySchema,
  SportTypeSchema,
  TrainingGoalTypeSchema,
  TrainingZoneTypeSchema,
  TrainingZoneUnitSchema,
  WeekdaySchema,
} from './enums.js';

export const AthleteThresholdsDtoSchema = z.object({
  currentFtpWatts: NonNegativeIntegerSchema.optional(),
  maxHeartRateBpm: NonNegativeIntegerSchema.optional(),
  restingHeartRateBpm: NonNegativeIntegerSchema.optional(),
  runningThresholdPaceSecPerKm: NonNegativeIntegerSchema.optional(),
  swimmingThresholdPaceSecPer100m: NonNegativeIntegerSchema.optional(),
});

export const AthleteProfileDtoSchema = z.object({
  id: IdSchema,
  displayName: z.string().min(1),
  birthYear: z.number().int().optional(),
  bodyWeightKg: NonNegativeNumberSchema.optional(),
  heightCm: NonNegativeIntegerSchema.optional(),
  primarySports: z.array(SportTypeSchema),
  thresholds: AthleteThresholdsDtoSchema,
  notes: z.string().optional(),
  createdAt: IsoDateTimeStringSchema.optional(),
  updatedAt: IsoDateTimeStringSchema.optional(),
});

export const TrainingGoalDtoSchema = z.object({
  id: IdSchema,
  title: z.string().min(1),
  goalType: TrainingGoalTypeSchema,
  targetDate: IsoDateStringSchema.optional(),
  sport: SportTypeSchema.optional(),
  priority: GoalPrioritySchema,
  targetDistanceMeters: NonNegativeIntegerSchema.optional(),
  targetDurationSeconds: NonNegativeIntegerSchema.optional(),
  targetPaceSecPerKm: NonNegativeIntegerSchema.optional(),
  targetPowerWatts: NonNegativeIntegerSchema.optional(),
  targetSwimPaceSecPer100m: NonNegativeIntegerSchema.optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

export const TrainingAvailabilityDtoSchema = z.object({
  weekday: WeekdaySchema,
  available: z.boolean(),
  maxDurationMinutes: NonNegativeIntegerSchema.optional(),
  preferredSports: z.array(SportTypeSchema),
  notes: z.string().optional(),
});

export const TrainingZoneDtoSchema = z.object({
  id: IdSchema,
  zoneNumber: NonNegativeIntegerSchema,
  name: z.string().min(1),
  lowerBound: z.number().optional(),
  upperBound: z.number().optional(),
  unit: TrainingZoneUnitSchema,
  description: z.string().optional(),
});

export const TrainingZoneSetDtoSchema = z.object({
  id: IdSchema,
  sport: SportTypeSchema.optional(),
  zoneType: TrainingZoneTypeSchema,
  name: z.string().min(1),
  basedOn: z.string().optional(),
  isActive: z.boolean(),
  zones: z.array(TrainingZoneDtoSchema),
});

export const AthleteSettingsDtoSchema = z.object({
  athleteProfile: AthleteProfileDtoSchema,
  goals: z.array(TrainingGoalDtoSchema),
  availability: z.array(TrainingAvailabilityDtoSchema),
  trainingZoneSets: z.array(TrainingZoneSetDtoSchema),
});

export type AthleteThresholdsDto = z.infer<typeof AthleteThresholdsDtoSchema>;
export type AthleteProfileDto = z.infer<typeof AthleteProfileDtoSchema>;
export type TrainingGoalDto = z.infer<typeof TrainingGoalDtoSchema>;
export type TrainingAvailabilityDto = z.infer<
  typeof TrainingAvailabilityDtoSchema
>;
export type TrainingZoneDto = z.infer<typeof TrainingZoneDtoSchema>;
export type TrainingZoneSetDto = z.infer<typeof TrainingZoneSetDtoSchema>;
export type AthleteSettingsDto = z.infer<typeof AthleteSettingsDtoSchema>;
