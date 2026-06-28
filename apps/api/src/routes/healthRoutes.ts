import type { FastifyInstance } from 'fastify';

import { ApiError } from '../errors/ApiError.js';
import * as HealthDataService from '../services/HealthDataService.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: unknown, name: string): Date {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw ApiError.badRequest(`${name} must be YYYY-MM-DD`);
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw ApiError.badRequest(`${name} is not a valid date`);
  return d;
}

function parseDateRange(query: { from?: unknown; to?: unknown }): { from: Date; to: Date } {
  const from = parseDate(query.from, 'from');
  const to = parseDate(query.to, 'to');
  if (from > to) throw ApiError.badRequest('from must be before or equal to to');
  return { from, to };
}

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health/daily', async (request) => {
    const { from, to } = parseDateRange(request.query as { from?: unknown; to?: unknown });
    return HealthDataService.getDailyHealth(from, to);
  });

  app.get('/api/health/sleep', async (request) => {
    const { from, to } = parseDateRange(request.query as { from?: unknown; to?: unknown });
    return HealthDataService.getSleepSessions(from, to);
  });

  app.get('/api/health/hrv', async (request) => {
    const { from, to } = parseDateRange(request.query as { from?: unknown; to?: unknown });
    return HealthDataService.getHrvStatuses(from, to);
  });
}
