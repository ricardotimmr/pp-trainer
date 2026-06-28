import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSourceConnection } from '@prisma/client';
import type { ApiConfig } from '../../config/env.js';

vi.mock('../../lib/prisma.js', () => ({ prisma: {}, disconnectPrisma: vi.fn() }));
vi.mock('../../config/env.js', () => ({ getApiConfig: vi.fn() }));
vi.mock('../../services/StravaOAuthService.js');

const { getApiConfig }       = await import('../../config/env.js');
const StravaOAuthService     = await import('../../services/StravaOAuthService.js');

import { setupErrorHandling }  from '../../errors/errorHandler.js';
import { connectionRoutes }    from '../../routes/connectionRoutes.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

const WEB_ORIGIN = 'http://localhost:5173';

function buildApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(connectionRoutes);
  return app;
}

function makeConfig(overrides: Record<string, string | undefined> = {}) {
  return {
    stravaClientId:     'client-123',
    stravaClientSecret: 'secret-abc',
    stravaRedirectUri:  'http://localhost:3000/api/connections/strava/callback',
    webOrigin:          WEB_ORIGIN,
    port: 3001,
    nodeEnv: 'test',
    databaseUrl: 'postgresql://test',
    ...overrides,
  };
}

function makeConnection(overrides: Partial<DataSourceConnection> = {}): DataSourceConnection {
  return {
    id: 'conn-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    athleteProfileId: 'profile-abc',
    source: 'Strava',
    isActive: true,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: new Date(Date.now() + 3600 * 1000),
    lastSyncedAt: null,
    lastSyncedItemAt: null,
    externalUserId: '1234567',
    username: null,
    password: null,
    metadata: { athleteName: 'Test Athlete' },
    ...overrides,
  } as DataSourceConnection;
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getApiConfig).mockReturnValue(makeConfig() as unknown as ApiConfig);
  vi.mocked(StravaOAuthService.getConnection).mockResolvedValue(null);
  vi.mocked(StravaOAuthService.getAuthUrl).mockReturnValue('https://www.strava.com/oauth/authorize?client_id=client-123');
  vi.mocked(StravaOAuthService.exchangeCode).mockResolvedValue(makeConnection());
  vi.mocked(StravaOAuthService.disconnect).mockResolvedValue(undefined);
});

// ── GET /api/connections/strava ───────────────────────────────────────────────

describe('GET /api/connections/strava', () => {
  it('returns connected: false when no connection exists', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/connections/strava' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.connected).toBe(false);
    expect(body.configured).toBe(true);
  });

  it('returns connected: true with athlete info when connection exists', async () => {
    vi.mocked(StravaOAuthService.getConnection).mockResolvedValue(makeConnection());
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/connections/strava' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.connected).toBe(true);
    expect(body.athleteName).toBe('Test Athlete');
    expect(body.externalAthleteId).toBe('1234567');
  });

  it('returns configured: false when client credentials not set', async () => {
    vi.mocked(getApiConfig).mockReturnValue(
      makeConfig({ stravaClientId: undefined, stravaClientSecret: undefined }) as unknown as ApiConfig,
    );
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/connections/strava' });
    expect(res.statusCode).toBe(200);
    expect(res.json().configured).toBe(false);
  });

  it('includes lastSyncedAt when connection has been synced', async () => {
    const lastSyncedAt = new Date('2024-03-15T10:00:00Z');
    vi.mocked(StravaOAuthService.getConnection).mockResolvedValue(
      makeConnection({ lastSyncedAt }),
    );
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/connections/strava' });
    expect(res.statusCode).toBe(200);
    expect(res.json().lastSyncedAt).toBe('2024-03-15T10:00:00.000Z');
  });

  it('returns athleteName as undefined when metadata has no athleteName', async () => {
    vi.mocked(StravaOAuthService.getConnection).mockResolvedValue(
      makeConnection({ metadata: null }),
    );
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/connections/strava' });
    const body = res.json();
    expect(body.connected).toBe(true);
    expect(body.athleteName).toBeUndefined();
  });
});

// ── POST /api/connections/strava/authorize ────────────────────────────────────

describe('POST /api/connections/strava/authorize', () => {
  it('returns authUrl when Strava is configured', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/api/connections/strava/authorize' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.authUrl).toContain('strava.com');
  });

  it('returns 503 when Strava client credentials not configured', async () => {
    vi.mocked(getApiConfig).mockReturnValue(
      makeConfig({ stravaClientId: undefined, stravaClientSecret: undefined }) as unknown as ApiConfig,
    );
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/api/connections/strava/authorize' });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('SERVICE_UNAVAILABLE');
  });
});

// ── GET /api/connections/strava/callback ──────────────────────────────────────

describe('GET /api/connections/strava/callback', () => {
  it('redirects to /import?strava=connected on successful OAuth exchange', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/connections/strava/callback?code=valid-auth-code',
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`${WEB_ORIGIN}/import?strava=connected`);
    expect(StravaOAuthService.exchangeCode).toHaveBeenCalledWith('valid-auth-code');
  });

  it('redirects to /import?strava=denied when user denies access', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/connections/strava/callback?error=access_denied',
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`${WEB_ORIGIN}/import?strava=denied`);
    expect(StravaOAuthService.exchangeCode).not.toHaveBeenCalled();
  });

  it('returns 400 when code param is missing', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/connections/strava/callback' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('BAD_REQUEST');
  });

  it('returns 503 when Strava credentials not configured', async () => {
    vi.mocked(getApiConfig).mockReturnValue(
      makeConfig({ stravaClientId: undefined, stravaClientSecret: undefined }) as unknown as ApiConfig,
    );
    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/connections/strava/callback?code=some-code',
    });
    expect(res.statusCode).toBe(503);
  });
});

// ── DELETE /api/connections/strava ────────────────────────────────────────────

describe('DELETE /api/connections/strava', () => {
  it('returns 204 and calls disconnect', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/connections/strava' });
    expect(res.statusCode).toBe(204);
    expect(StravaOAuthService.disconnect).toHaveBeenCalledOnce();
  });

  it('returns 204 even when no connection exists (idempotent)', async () => {
    vi.mocked(StravaOAuthService.disconnect).mockResolvedValue(undefined);
    const app = buildApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/connections/strava' });
    expect(res.statusCode).toBe(204);
  });
});
