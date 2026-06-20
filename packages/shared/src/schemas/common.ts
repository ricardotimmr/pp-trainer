import { z } from 'zod';

export const IdSchema = z.string().min(1);
export const IsoDateStringSchema = z.string().min(1);
export const IsoDateTimeStringSchema = z.string().min(1);
export const NonNegativeIntegerSchema = z.number().int().nonnegative();
export const NonNegativeNumberSchema = z.number().nonnegative();
export const PercentageSchema = z.number().min(0).max(100);

export type IdDto = z.infer<typeof IdSchema>;
