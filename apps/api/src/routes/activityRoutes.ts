import type { FastifyInstance } from 'fastify';

import * as ActivityService from '../services/ActivityService.js';

const VALID_SPORTS = ['cycling', 'running', 'swimming', 'strength', 'mobility', 'other'] as const;

export async function activityRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/api/activities',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            sport: { type: 'string', enum: VALID_SPORTS },
            dateFrom: { type: 'string' },
            dateTo: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const query = request.query as {
        sport?: string;
        dateFrom?: string;
        dateTo?: string;
      };
      return ActivityService.getActivities({
        sport: query.sport as (typeof VALID_SPORTS)[number] | undefined,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      });
    },
  );

  app.get('/api/activities/:id', async (request) => {
    const { id } = request.params as { id: string };
    return ActivityService.getActivityById(id);
  });
}
