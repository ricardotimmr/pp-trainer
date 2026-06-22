import { describe, expect, it } from 'vitest';

import { ApiError } from '../../errors/ApiError.js';

describe('ApiError', () => {
  describe('constructor', () => {
    it('sets code, statusCode, message and name', () => {
      const err = new ApiError('NOT_FOUND', 'Thing not found');
      expect(err.code).toBe('NOT_FOUND');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Thing not found');
      expect(err.name).toBe('ApiError');
      expect(err instanceof Error).toBe(true);
    });

    it('stores optional details', () => {
      const details = { field: 'id', issue: 'missing' };
      const err = new ApiError('VALIDATION_ERROR', 'Invalid input', details);
      expect(err.details).toEqual(details);
    });

    it('leaves details undefined when not provided', () => {
      const err = new ApiError('BAD_REQUEST', 'Bad');
      expect(err.details).toBeUndefined();
    });
  });

  describe('status code mapping', () => {
    it('maps NOT_FOUND to 404', () => {
      expect(new ApiError('NOT_FOUND', '').statusCode).toBe(404);
    });

    it('maps VALIDATION_ERROR to 400', () => {
      expect(new ApiError('VALIDATION_ERROR', '').statusCode).toBe(400);
    });

    it('maps BAD_REQUEST to 400', () => {
      expect(new ApiError('BAD_REQUEST', '').statusCode).toBe(400);
    });

    it('maps INTERNAL_SERVER_ERROR to 500', () => {
      expect(new ApiError('INTERNAL_SERVER_ERROR', '').statusCode).toBe(500);
    });
  });

  describe('static factories', () => {
    it('notFound uses default message', () => {
      const err = ApiError.notFound();
      expect(err.code).toBe('NOT_FOUND');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Resource not found');
    });

    it('notFound accepts a custom message', () => {
      const err = ApiError.notFound('Activity not found');
      expect(err.message).toBe('Activity not found');
    });

    it('badRequest sets code and optional details', () => {
      const err = ApiError.badRequest('Bad input', { field: 'x' });
      expect(err.code).toBe('BAD_REQUEST');
      expect(err.statusCode).toBe(400);
      expect(err.details).toEqual({ field: 'x' });
    });

    it('validationError sets code and optional details', () => {
      const err = ApiError.validationError('Schema mismatch', [{ path: 'name' }]);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.statusCode).toBe(400);
      expect(err.details).toEqual([{ path: 'name' }]);
    });
  });
});
