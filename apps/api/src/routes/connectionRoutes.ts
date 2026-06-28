import type { FastifyInstance } from 'fastify';

import { ApiError } from '../errors/ApiError.js';
import { getApiConfig } from '../config/env.js';
import type { StravaConnectionStatusDto } from '@pp-trainer/shared';
import * as StravaOAuthService from '../services/StravaOAuthService.js';

export async function connectionRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/connections/strava — current connection status
  app.get('/api/connections/strava', async (): Promise<StravaConnectionStatusDto> => {
    const config = getApiConfig();
    const configured = !!(config.stravaClientId && config.stravaClientSecret);
    const connection = await StravaOAuthService.getConnection();
    if (!connection) return { configured, connected: false };

    const meta = connection.metadata as Record<string, unknown> | null;

    return {
      configured,
      connected:          true,
      athleteName:        typeof meta?.athleteName === 'string' ? meta.athleteName : undefined,
      externalAthleteId:  connection.externalUserId ?? undefined,
      lastSyncedAt:       connection.lastSyncedAt?.toISOString(),
    };
  });

  // POST /api/connections/strava/authorize — start OAuth flow
  app.post('/api/connections/strava/authorize', async () => {
    const config = getApiConfig();
    if (!config.stravaClientId || !config.stravaClientSecret) {
      throw ApiError.serviceUnavailable('Strava integration is not configured on this server');
    }
    return { authUrl: StravaOAuthService.getAuthUrl() };
  });

  // GET /api/connections/strava/callback?code=&state= — OAuth callback
  app.get('/api/connections/strava/callback', async (request, reply) => {
    const config = getApiConfig();
    if (!config.stravaClientId || !config.stravaClientSecret) {
      throw ApiError.serviceUnavailable('Strava integration is not configured on this server');
    }

    const query = request.query as { code?: unknown; error?: unknown };
    if (typeof query.error === 'string') {
      return reply.redirect(`${config.webOrigin}/import?strava=denied`);
    }
    if (typeof query.code !== 'string' || !query.code) {
      throw ApiError.badRequest('Missing code parameter in Strava callback');
    }

    await StravaOAuthService.exchangeCode(query.code);
    return reply.redirect(`${config.webOrigin}/import?strava=connected`);
  });

  // DELETE /api/connections/strava — disconnect
  app.delete('/api/connections/strava', async (_request, reply) => {
    await StravaOAuthService.disconnect();
    return reply.status(204).send();
  });
}
