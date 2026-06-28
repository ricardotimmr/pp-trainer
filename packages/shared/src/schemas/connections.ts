import { z } from 'zod';

import { IsoDateTimeStringSchema } from './common.js';

export const StravaConnectionStatusDtoSchema = z.object({
  configured: z.boolean(),
  connected: z.boolean(),
  athleteName: z.string().optional(),
  externalAthleteId: z.string().optional(),
  lastSyncedAt: IsoDateTimeStringSchema.optional(),
});

export type StravaConnectionStatusDto = z.infer<typeof StravaConnectionStatusDtoSchema>;
