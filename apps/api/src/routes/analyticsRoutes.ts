import type { FastifyInstance } from 'fastify';

import { ApiError } from '../errors/ApiError.js';
import * as AnalyticsService from '../services/AnalyticsService.js';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseWeeks(value: unknown): number {
  if (value == null) return 8;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw ApiError.badRequest('weeks must be an integer between 1 and 26');
  }

  const weeks = Number(value);
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 26) {
    throw ApiError.badRequest('weeks must be an integer between 1 and 26');
  }

  return weeks;
}

function parseDateQuery(value: unknown, fieldName: string): { value: string; date: Date } {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) {
    throw ApiError.badRequest(`${fieldName} must be a valid YYYY-MM-DD date`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || toDateOnly(date) !== value) {
    throw ApiError.badRequest(`${fieldName} must be a valid YYYY-MM-DD date`);
  }
  return { value, date };
}

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/analytics/weekly-summary', async (request) => {
    const query = request.query as { weeks?: unknown };
    const weeks = parseWeeks(query.weeks);
    return AnalyticsService.getCurrentAthleteWeeklySummaries(weeks);
  });

  app.get('/api/analytics/sport-distribution', async (request) => {
    const query = request.query as { from?: unknown; to?: unknown };
    const from = parseDateQuery(query.from, 'from');
    const to = parseDateQuery(query.to, 'to');
    if (from.date.getTime() > to.date.getTime()) {
      throw ApiError.badRequest('from must be before or equal to to');
    }
    return AnalyticsService.getCurrentAthleteSportDistribution(from.value, to.value);
  });
}
