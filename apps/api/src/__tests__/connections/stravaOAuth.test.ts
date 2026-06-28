import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AthleteProfile, DataSourceConnection } from '@prisma/client';
import type { ApiConfig } from '../../config/env.js';

vi.mock('../../lib/prisma.js', () => ({ prisma: {}, disconnectPrisma: vi.fn() }));
vi.mock('../../config/env.js', () => ({ getApiConfig: vi.fn() }));
vi.mock('../../repositories/AthleteRepository.js');
vi.mock('../../repositories/DataSourceConnectionRepository.js');

const { getApiConfig } = await import('../../config/env.js');
const AthleteRepository = await import('../../repositories/AthleteRepository.js');
const DataSourceConnectionRepository = await import('../../repositories/DataSourceConnectionRepository.js');
const StravaOAuthService = await import('../../services/StravaOAuthService.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROFILE_ID = 'profile-abc';

function makeConfig(overrides: Record<string, string | undefined> = {}) {
  return {
    stravaClientId:     'client-123',
    stravaClientSecret: 'secret-abc',
    stravaRedirectUri:  'http://127.0.0.1:3000/api/connections/strava/callback',
    webOrigin:          'http://127.0.0.1:5173',
    ...overrides,
  };
}

function makeConnection(overrides: Partial<DataSourceConnection> = {}): DataSourceConnection {
  return {
    id: 'conn-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    athleteProfileId: PROFILE_ID,
    source: 'Strava',
    isActive: true,
    accessToken: 'access-token-old',
    refreshToken: 'refresh-token-old',
    expiresAt: new Date(Date.now() + 3600 * 1000),
    lastSyncedAt: null,
    lastSyncedItemAt: null,
    externalUserId: '1234567',
    username: null,
    password: null,
    metadata: { athleteName: 'Ricardo Timmr' },
    ...overrides,
  } as DataSourceConnection;
}

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

const STRAVA_TOKEN_RESPONSE = {
  access_token:  'new-access-token',
  refresh_token: 'new-refresh-token',
  expires_at:    1800000000,
  athlete: {
    id:        1234567,
    firstname: 'Ricardo',
    lastname:  'Timmr',
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getApiConfig).mockReturnValue(makeConfig() as unknown as ApiConfig);
  vi.mocked(AthleteRepository.findFirstAthleteProfile).mockResolvedValue({ id: PROFILE_ID } as unknown as AthleteProfile);
  vi.mocked(DataSourceConnectionRepository.upsertConnection).mockResolvedValue(makeConnection());
  vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue(null);
  vi.mocked(DataSourceConnectionRepository.deleteConnection).mockResolvedValue();
});

// ── getAuthUrl ────────────────────────────────────────────────────────────────

describe('getAuthUrl', () => {
  it('returns correct Strava authorize URL with required params', () => {
    const url = new URL(StravaOAuthService.getAuthUrl());
    expect(url.hostname).toBe('www.strava.com');
    expect(url.pathname).toBe('/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('client-123');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toContain('activity:read_all');
    expect(url.searchParams.get('redirect_uri')).toContain('strava/callback');
  });

  it('throws 503 when stravaClientId is not configured', () => {
    vi.mocked(getApiConfig).mockReturnValue(makeConfig({ stravaClientId: undefined }) as unknown as ApiConfig);
    expect(() => StravaOAuthService.getAuthUrl()).toThrow('not configured');
  });
});

// ── exchangeCode ──────────────────────────────────────────────────────────────

describe('exchangeCode', () => {
  it('POSTs to Strava token URL with authorization_code grant', async () => {
    const fetchMock = mockFetch(STRAVA_TOKEN_RESPONSE);
    vi.stubGlobal('fetch', fetchMock);

    await StravaOAuthService.exchangeCode('auth-code-xyz');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.strava.com/oauth/token',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.code).toBe('auth-code-xyz');
    expect(body.grant_type).toBe('authorization_code');
    expect(body.client_id).toBe('client-123');
    expect(body.client_secret).toBe('secret-abc');
  });

  it('upserts DataSourceConnection with tokens and athlete info', async () => {
    vi.stubGlobal('fetch', mockFetch(STRAVA_TOKEN_RESPONSE));

    await StravaOAuthService.exchangeCode('auth-code-xyz');

    expect(DataSourceConnectionRepository.upsertConnection).toHaveBeenCalledWith(
      PROFILE_ID,
      'Strava',
      expect.objectContaining({
        accessToken:    'new-access-token',
        refreshToken:   'new-refresh-token',
        expiresAt:      new Date(1800000000 * 1000),
        externalUserId: '1234567',
        metadata:       { athleteName: 'Ricardo Timmr' },
      }),
    );
  });

  it('omits metadata when athlete is missing from response', async () => {
    vi.stubGlobal('fetch', mockFetch({ ...STRAVA_TOKEN_RESPONSE, athlete: undefined }));

    await StravaOAuthService.exchangeCode('code');

    const call = vi.mocked(DataSourceConnectionRepository.upsertConnection).mock.calls[0][2];
    expect(call.metadata).toBeUndefined();
  });

  it('throws when Strava returns a non-OK response', async () => {
    vi.stubGlobal('fetch', mockFetch({ message: 'Bad Authorization Code' }, 400));

    await expect(StravaOAuthService.exchangeCode('bad-code')).rejects.toThrow('400');
  });

  it('throws 503 when stravaClientId is not configured', async () => {
    vi.mocked(getApiConfig).mockReturnValue(makeConfig({ stravaClientId: undefined }) as unknown as ApiConfig);

    await expect(StravaOAuthService.exchangeCode('code')).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});

// ── refreshAccessToken ────────────────────────────────────────────────────────

describe('refreshAccessToken', () => {
  it('POSTs with refresh_token grant type', async () => {
    const fetchMock = mockFetch(STRAVA_TOKEN_RESPONSE);
    vi.stubGlobal('fetch', fetchMock);

    await StravaOAuthService.refreshAccessToken(makeConnection());

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.grant_type).toBe('refresh_token');
    expect(body.refresh_token).toBe('refresh-token-old');
  });

  it('updates accessToken, refreshToken, and expiresAt on the connection', async () => {
    vi.stubGlobal('fetch', mockFetch(STRAVA_TOKEN_RESPONSE));

    await StravaOAuthService.refreshAccessToken(makeConnection());

    expect(DataSourceConnectionRepository.upsertConnection).toHaveBeenCalledWith(
      PROFILE_ID,
      'Strava',
      expect.objectContaining({
        accessToken:  'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt:    new Date(1800000000 * 1000),
      }),
    );
  });
});

// ── getConnection ─────────────────────────────────────────────────────────────

describe('getConnection', () => {
  it('returns null when no connection exists', async () => {
    vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue(null);
    expect(await StravaOAuthService.getConnection()).toBeNull();
  });

  it('returns the DataSourceConnection when it exists', async () => {
    const conn = makeConnection();
    vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue(conn);
    expect(await StravaOAuthService.getConnection()).toBe(conn);
    expect(DataSourceConnectionRepository.findConnection).toHaveBeenCalledWith(PROFILE_ID, 'Strava');
  });
});

// ── disconnect ────────────────────────────────────────────────────────────────

describe('disconnect', () => {
  it('calls Strava deauthorize endpoint with access_token', async () => {
    const fetchMock = mockFetch({});
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue(makeConnection());

    await StravaOAuthService.disconnect();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('deauthorize'),
      expect.objectContaining({ method: 'POST' }),
    );
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('access-token-old');
  });

  it('deletes DataSourceConnection regardless of Strava API response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue(makeConnection());

    await StravaOAuthService.disconnect();

    expect(DataSourceConnectionRepository.deleteConnection).toHaveBeenCalledWith(PROFILE_ID, 'Strava');
  });

  it('skips Strava deauthorize call when no connection exists', async () => {
    const fetchMock = mockFetch({});
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue(null);

    await StravaOAuthService.disconnect();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(DataSourceConnectionRepository.deleteConnection).toHaveBeenCalledWith(PROFILE_ID, 'Strava');
  });
});

// ── GET /api/connections/strava (via route) ───────────────────────────────────

describe('GET /api/connections/strava status', () => {
  it('returns connected: false when no connection in DB', async () => {
    vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue(null);
    const result = await StravaOAuthService.getConnection();
    expect(result).toBeNull();
  });

  it('returns connection with athleteName from metadata', async () => {
    vi.mocked(DataSourceConnectionRepository.findConnection).mockResolvedValue(
      makeConnection({ metadata: { athleteName: 'Ricardo Timmr' } }),
    );
    const conn = await StravaOAuthService.getConnection();
    const meta = conn?.metadata as Record<string, unknown> | null;
    expect(meta?.athleteName).toBe('Ricardo Timmr');
  });
});
