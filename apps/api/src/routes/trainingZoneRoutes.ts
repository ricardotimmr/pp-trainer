import {
  CreateZoneInputSchema,
  CreateZoneSetInputSchema,
  UpdateZoneInputSchema,
  UpdateZoneSetInputSchema,
} from '@pp-trainer/shared';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

import * as AthleteService from '../services/AthleteService.js';

function replyZodError(reply: FastifyReply, err: ZodError) {
  return reply.status(400).send({
    error: {
      code: 'VALIDATION_ERROR',
      message: err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
    },
  });
}

export async function trainingZoneRoutes(app: FastifyInstance): Promise<void> {
  // ── Zone sets ─────────────────────────────────────────────────────────────

  app.post('/api/training-zones/sets', async (request, reply) => {
    let body: ReturnType<typeof CreateZoneSetInputSchema.parse>;
    try {
      body = CreateZoneSetInputSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) return replyZodError(reply, err);
      throw err;
    }
    const zoneSet = await AthleteService.createZoneSet(body);
    return reply.status(201).send(zoneSet);
  });

  app.put('/api/training-zones/sets/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    let body: ReturnType<typeof UpdateZoneSetInputSchema.parse>;
    try {
      body = UpdateZoneSetInputSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) return replyZodError(reply, err);
      throw err;
    }
    const zoneSet = await AthleteService.updateZoneSet(id, body);
    return reply.status(200).send(zoneSet);
  });

  app.delete('/api/training-zones/sets/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await AthleteService.deleteZoneSet(id);
    return reply.status(204).send();
  });

  // ── Zones (within a set) ──────────────────────────────────────────────────

  app.post('/api/training-zones/sets/:id/zones', async (request, reply) => {
    const { id } = request.params as { id: string };
    let body: ReturnType<typeof CreateZoneInputSchema.parse>;
    try {
      body = CreateZoneInputSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) return replyZodError(reply, err);
      throw err;
    }
    const zone = await AthleteService.createZone(id, body);
    return reply.status(201).send(zone);
  });

  // ── Zones (standalone update / delete) ───────────────────────────────────

  app.put('/api/training-zones/zones/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    let body: ReturnType<typeof UpdateZoneInputSchema.parse>;
    try {
      body = UpdateZoneInputSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) return replyZodError(reply, err);
      throw err;
    }
    const zone = await AthleteService.updateZone(id, body);
    return reply.status(200).send(zone);
  });

  app.delete('/api/training-zones/zones/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await AthleteService.deleteZone(id);
    return reply.status(204).send();
  });
}
