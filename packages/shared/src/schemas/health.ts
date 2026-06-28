import { z } from 'zod';

import { IsoDateTimeStringSchema } from './common.js';
import { DataSourceTypeSchema } from './enums.js';

export const DailyHealthSummaryDtoSchema = z.object({
  id: z.string(),
  date: IsoDateTimeStringSchema,
  source: DataSourceTypeSchema,
  restingHeartRate: z.int().nonnegative().optional(),
  steps: z.int().nonnegative().optional(),
  floors: z.int().nonnegative().optional(),
  activeCalories: z.int().nonnegative().optional(),
  totalCalories: z.int().nonnegative().optional(),
  avgStressLevel: z.int().min(0).max(100).optional(),
  bodyBatteryLow: z.int().min(0).max(100).optional(),
  bodyBatteryHigh: z.int().min(0).max(100).optional(),
  avgRespiration: z.number().nonnegative().optional(),
  avgSpo2: z.number().min(0).max(100).optional(),
});

export const SleepSessionDtoSchema = z.object({
  id: z.string(),
  date: IsoDateTimeStringSchema,
  source: DataSourceTypeSchema,
  startTime: IsoDateTimeStringSchema.optional(),
  endTime: IsoDateTimeStringSchema.optional(),
  totalSleepSeconds: z.int().nonnegative().optional(),
  deepSleepSeconds: z.int().nonnegative().optional(),
  lightSleepSeconds: z.int().nonnegative().optional(),
  remSleepSeconds: z.int().nonnegative().optional(),
  awakeSeconds: z.int().nonnegative().optional(),
  sleepScore: z.int().min(0).max(100).optional(),
  avgStress: z.number().min(0).max(100).optional(),
  avgSpo2: z.number().min(0).max(100).optional(),
});

export const HrvStatusDtoSchema = z.object({
  id: z.string(),
  date: IsoDateTimeStringSchema,
  source: DataSourceTypeSchema,
  weeklyAvgHrv: z.number().nonnegative().optional(),
  lastNightAvgHrv: z.number().nonnegative().optional(),
  lastNightFiveMinHigh: z.number().nonnegative().optional(),
  status: z.enum(['balanced', 'unbalanced', 'poor', 'low', 'none']).optional(),
});

export const DailyHealthResponseDtoSchema = z.object({
  days: z.array(DailyHealthSummaryDtoSchema),
});
export const SleepSessionResponseDtoSchema = z.object({
  sessions: z.array(SleepSessionDtoSchema),
});
export const HrvStatusResponseDtoSchema = z.object({
  statuses: z.array(HrvStatusDtoSchema),
});

export type DailyHealthSummaryDto = z.infer<typeof DailyHealthSummaryDtoSchema>;
export type SleepSessionDto = z.infer<typeof SleepSessionDtoSchema>;
export type HrvStatusDto = z.infer<typeof HrvStatusDtoSchema>;
export type DailyHealthResponseDto = z.infer<typeof DailyHealthResponseDtoSchema>;
export type SleepSessionResponseDto = z.infer<typeof SleepSessionResponseDtoSchema>;
export type HrvStatusResponseDto = z.infer<typeof HrvStatusResponseDtoSchema>;
