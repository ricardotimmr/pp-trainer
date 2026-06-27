import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../errors/ApiError.js';
import { setupErrorHandling } from '../../errors/errorHandler.js';
import { trainingZoneRoutes } from '../../routes/trainingZoneRoutes.js';
import * as AthleteService from '../../services/AthleteService.js';

vi.mock('../../lib/prisma.js', () => ({ prisma: {}, disconnectPrisma: vi.fn() }));
vi.mock('../../services/AthleteService.js');

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);
  void app.register(trainingZoneRoutes);
  return app;
}

const mockZoneSetDto = {
  id: 'zs-1',
  name: 'Power Zones',
  zoneType: 'cycling_power',
  sport: 'cycling',
  isActive: true,
  zones: [],
};

const mockZoneDto = {
  id: 'zone-1',
  zoneNumber: 1,
  name: 'Zone 1',
  unit: 'watts',
  lowerBound: null,
  upperBound: 150,
  description: null,
};

afterEach(() => {
  vi.resetAllMocks();
});

// ── POST /api/training-zones/sets ─────────────────────────────────────────────

describe('POST /api/training-zones/sets', () => {
  it('returns 201 with created zone set', async () => {
    vi.mocked(AthleteService.createZoneSet).mockResolvedValue(mockZoneSetDto as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/training-zones/sets',
      payload: { zoneType: 'cycling_power', name: 'Power Zones', sport: 'cycling' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBe('zs-1');
    expect(res.json().zoneType).toBe('cycling_power');
  });

  it('returns 400 for missing required fields', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/training-zones/sets',
      payload: { name: 'Missing type' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when no profile exists', async () => {
    vi.mocked(AthleteService.createZoneSet).mockRejectedValue(ApiError.notFound('Athlete profile not found'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/training-zones/sets',
      payload: { zoneType: 'heart_rate', name: 'HR Zones' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});

// ── PUT /api/training-zones/sets/:id ──────────────────────────────────────────

describe('PUT /api/training-zones/sets/:id', () => {
  it('returns 200 with updated zone set', async () => {
    vi.mocked(AthleteService.updateZoneSet).mockResolvedValue({ ...mockZoneSetDto, name: 'Updated' } as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/training-zones/sets/zs-1',
      payload: { name: 'Updated' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('Updated');
  });

  it('returns 404 when zone set not found', async () => {
    vi.mocked(AthleteService.updateZoneSet).mockRejectedValue(ApiError.notFound('Training zone set not found'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/training-zones/sets/missing',
      payload: { name: 'X' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});

// ── DELETE /api/training-zones/sets/:id ───────────────────────────────────────

describe('DELETE /api/training-zones/sets/:id', () => {
  it('returns 204 on success', async () => {
    vi.mocked(AthleteService.deleteZoneSet).mockResolvedValue();
    const app = buildTestApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/training-zones/sets/zs-1' });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 when zone set not found', async () => {
    vi.mocked(AthleteService.deleteZoneSet).mockRejectedValue(ApiError.notFound('Training zone set not found'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/training-zones/sets/missing' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});

// ── POST /api/training-zones/sets/:id/zones ───────────────────────────────────

describe('POST /api/training-zones/sets/:id/zones', () => {
  it('returns 201 with created zone', async () => {
    vi.mocked(AthleteService.createZone).mockResolvedValue(mockZoneDto as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/training-zones/sets/zs-1/zones',
      payload: { zoneNumber: 1, name: 'Zone 1', unit: 'watts' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBe('zone-1');
    expect(res.json().unit).toBe('watts');
  });

  it('returns 400 for missing required fields', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/training-zones/sets/zs-1/zones',
      payload: { name: 'Missing zoneNumber and unit' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when zone set not found', async () => {
    vi.mocked(AthleteService.createZone).mockRejectedValue(ApiError.notFound('Training zone set not found'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/training-zones/sets/missing/zones',
      payload: { zoneNumber: 1, name: 'Z', unit: 'bpm' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});

// ── PUT /api/training-zones/zones/:id ─────────────────────────────────────────

describe('PUT /api/training-zones/zones/:id', () => {
  it('returns 200 with updated zone', async () => {
    vi.mocked(AthleteService.updateZone).mockResolvedValue({ ...mockZoneDto, name: 'Zone 1 Updated' } as never);
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/training-zones/zones/zone-1',
      payload: { name: 'Zone 1 Updated' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('Zone 1 Updated');
  });

  it('returns 404 when zone not found', async () => {
    vi.mocked(AthleteService.updateZone).mockRejectedValue(ApiError.notFound('Training zone not found'));
    const app = buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/training-zones/zones/missing',
      payload: { name: 'X' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});

// ── DELETE /api/training-zones/zones/:id ──────────────────────────────────────

describe('DELETE /api/training-zones/zones/:id', () => {
  it('returns 204 on success', async () => {
    vi.mocked(AthleteService.deleteZone).mockResolvedValue();
    const app = buildTestApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/training-zones/zones/zone-1' });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 when zone not found', async () => {
    vi.mocked(AthleteService.deleteZone).mockRejectedValue(ApiError.notFound('Training zone not found'));
    const app = buildTestApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/training-zones/zones/missing' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});
