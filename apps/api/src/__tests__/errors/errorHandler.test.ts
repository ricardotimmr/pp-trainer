import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';

import { ApiError } from '../../errors/ApiError.js';
import { setupErrorHandling } from '../../errors/errorHandler.js';

function buildTestApp() {
  const app = Fastify({ logger: false });
  setupErrorHandling(app);

  app.get('/throw-not-found', async () => {
    throw ApiError.notFound('Activity not found');
  });

  app.get('/throw-bad-request', async () => {
    throw ApiError.badRequest('Missing field', { field: 'sport' });
  });

  app.get('/throw-validation', async () => {
    throw ApiError.validationError('Schema mismatch', [{ path: 'name' }]);
  });

  app.get('/throw-unexpected', async () => {
    throw new Error('Something exploded');
  });

  app.get(
    '/with-schema',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
      },
    },
    async () => ({ ok: true }),
  );

  return app;
}

describe('errorHandler', () => {
  describe('ApiError responses', () => {
    it('returns 404 with NOT_FOUND shape', async () => {
      const app = buildTestApp();
      const res = await app.inject({ method: 'GET', url: '/throw-not-found' });
      expect(res.statusCode).toBe(404);
      const body = res.json<{ error: { code: string; message: string } }>();
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Activity not found');
    });

    it('returns 400 with BAD_REQUEST shape and details', async () => {
      const app = buildTestApp();
      const res = await app.inject({ method: 'GET', url: '/throw-bad-request' });
      expect(res.statusCode).toBe(400);
      const body = res.json<{ error: { code: string; details: unknown } }>();
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.details).toEqual({ field: 'sport' });
    });

    it('returns 400 with VALIDATION_ERROR shape and details', async () => {
      const app = buildTestApp();
      const res = await app.inject({ method: 'GET', url: '/throw-validation' });
      expect(res.statusCode).toBe(400);
      const body = res.json<{ error: { code: string } }>();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 500 with INTERNAL_SERVER_ERROR for unexpected errors', async () => {
      const app = buildTestApp();
      const res = await app.inject({ method: 'GET', url: '/throw-unexpected' });
      expect(res.statusCode).toBe(500);
      const body = res.json<{ error: { code: string } }>();
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('Fastify schema validation', () => {
    it('returns 400 with VALIDATION_ERROR when schema is violated', async () => {
      const app = buildTestApp();
      const res = await app.inject({ method: 'GET', url: '/with-schema' });
      expect(res.statusCode).toBe(400);
      const body = res.json<{ error: { code: string; details: unknown } }>();
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toBeDefined();
    });
  });

  describe('not-found handler', () => {
    it('returns 404 with NOT_FOUND for unknown routes', async () => {
      const app = buildTestApp();
      const res = await app.inject({ method: 'GET', url: '/does-not-exist' });
      expect(res.statusCode).toBe(404);
      const body = res.json<{ error: { code: string; message: string } }>();
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Route not found');
    });
  });

  describe('error response shape', () => {
    it('always includes error.code and error.message', async () => {
      const app = buildTestApp();
      const routes = [
        '/throw-not-found',
        '/throw-bad-request',
        '/throw-unexpected',
        '/does-not-exist',
      ];

      for (const url of routes) {
        const res = await app.inject({ method: 'GET', url });
        const body = res.json<{ error: { code?: unknown; message?: unknown } }>();
        expect(body.error, `route ${url}`).toBeDefined();
        expect(typeof body.error.code, `route ${url}`).toBe('string');
        expect(typeof body.error.message, `route ${url}`).toBe('string');
      }
    });

    it('omits details key when not applicable', async () => {
      const app = buildTestApp();
      const res = await app.inject({ method: 'GET', url: '/throw-not-found' });
      const body = res.json<{ error: Record<string, unknown> }>();
      expect('details' in body.error).toBe(false);
    });
  });
});
