import { z } from 'zod';

import { IsoDateStringSchema, NonNegativeIntegerSchema } from './common.js';
import { SportTypeSchema } from './enums.js';

export const WeeklySummarySportBreakdownDtoSchema = z.object({
  sport: SportTypeSchema,
  seconds: NonNegativeIntegerSchema,
});

export const WeeklySummaryDtoSchema = z.object({
  weekStart: IsoDateStringSchema,
  totalSeconds: NonNegativeIntegerSchema,
  bySport: z.array(WeeklySummarySportBreakdownDtoSchema),
});

export const SportDistributionDtoSchema = z.object({
  sport: SportTypeSchema,
  activityCount: NonNegativeIntegerSchema,
  totalSeconds: NonNegativeIntegerSchema,
});

export const WeeklySummaryResponseDtoSchema = z.array(WeeklySummaryDtoSchema);
export const SportDistributionResponseDtoSchema = z.array(SportDistributionDtoSchema);

export type WeeklySummarySportBreakdownDto = z.infer<
  typeof WeeklySummarySportBreakdownDtoSchema
>;
export type WeeklySummaryDto = z.infer<typeof WeeklySummaryDtoSchema>;
export type SportDistributionDto = z.infer<typeof SportDistributionDtoSchema>;
export type WeeklySummaryResponseDto = z.infer<typeof WeeklySummaryResponseDtoSchema>;
export type SportDistributionResponseDto = z.infer<
  typeof SportDistributionResponseDtoSchema
>;
