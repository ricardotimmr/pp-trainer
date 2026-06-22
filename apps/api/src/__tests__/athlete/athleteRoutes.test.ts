import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../errors/ApiError.js';
import { setupErrorHandling } from '../../errors/errorHandler.js';
import { athleteRoutes } from '../../routes/athleteRoutes.js';
import * as AthleteService from '../../services/AthleteService.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../services/AthleteService.js');

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(athleteRoutes);
  return app;
}

const mockSettings = {
  athleteProfile: {
    id: 'profile-1',
    displayName: 'Test Athlete',
    primarySports: ['cycling', 'running'],
    thresholds: { currentFtpWatts: 280, maxHeartRateBpm: 185 },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  goals: [
    {
      id: 'goal-1',
      title: 'Run a marathon',
      goalType: 'race',
      priority: 'main_goal',
      isActive: true,
    },
  ],
  availability: [
    { weekday: 'monday', available: true, preferredSports: ['running'] },
  ],
  trainingZoneSets: [],
};

describe('GET /api/athlete/profile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 200 with athlete settings shape', async () => {
    vi.mocked(AthleteService.getAthleteSettings).mockResolvedValue(mockSettings as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/profile' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.athleteProfile.id).toBe('profile-1');
    expect(body.athleteProfile.displayName).toBe('Test Athlete');
    expect(body.athleteProfile.primarySports).toEqual(['cycling', 'running']);
  });

  it('returns goals with priority semantics', async () => {
    vi.mocked(AthleteService.getAthleteSettings).mockResolvedValue(mockSettings as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/profile' });
    const body = res.json();
    expect(body.goals[0].priority).toBe('main_goal');
  });

  it('returns availability array', async () => {
    vi.mocked(AthleteService.getAthleteSettings).mockResolvedValue(mockSettings as never);
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/profile' });
    const body = res.json();
    expect(body.availability[0].weekday).toBe('monday');
  });

  it('returns 404 with NOT_FOUND when no profile exists', async () => {
    vi.mocked(AthleteService.getAthleteSettings).mockRejectedValue(
      ApiError.notFound('Athlete profile not found'),
    );
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/profile' });
    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Athlete profile not found');
  });

  it('returns 500 for unexpected service errors', async () => {
    vi.mocked(AthleteService.getAthleteSettings).mockRejectedValue(new Error('DB connection lost'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/athlete/profile' });
    expect(res.statusCode).toBe(500);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
