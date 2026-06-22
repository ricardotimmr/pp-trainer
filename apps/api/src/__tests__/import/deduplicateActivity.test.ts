import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deduplicateActivity } from '../../import/dedup/deduplicateActivity.js';
import type { ParsedActivity } from '../../import/types.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../repositories/ImportJobRepository.js', () => ({
  findImportJobByHash: vi.fn(),
  createImportJob: vi.fn(),
  findImportJobById: vi.fn(),
  findImportJobs: vi.fn(),
  updateImportJob: vi.fn(),
}));

vi.mock('../../repositories/ActivityRepository.js', () => ({
  findSimilarActivity: vi.fn(),
  findActivities: vi.fn(),
  findActivityById: vi.fn(),
}));

const { findImportJobByHash } = await import('../../repositories/ImportJobRepository.js');
const { findSimilarActivity } = await import('../../repositories/ActivityRepository.js');

const PROFILE_ID = 'profile-1';
const HASH = 'abc123hash';

const baseParsed: ParsedActivity = {
  source: 'ManualJsonImport',
  sport: 'running',
  startTime: new Date('2026-06-22T07:30:00Z'),
  durationSeconds: 3600,
};

describe('deduplicateActivity', () => {
  beforeEach(() => vi.resetAllMocks());

  describe('exact hash check', () => {
    it('returns isDuplicate: true when hash matches existing successful job', async () => {
      vi.mocked(findImportJobByHash).mockResolvedValue({ activityId: 'act-existing' });
      vi.mocked(findSimilarActivity).mockResolvedValue(null);

      const result = await deduplicateActivity(PROFILE_ID, baseParsed, HASH);

      expect(result.isDuplicate).toBe(true);
      if (result.isDuplicate) {
        expect(result.existingActivityId).toBe('act-existing');
        expect(result.reason).toContain('hash');
      }
    });

    it('checks hash with the correct athleteProfileId', async () => {
      vi.mocked(findImportJobByHash).mockResolvedValue({ activityId: 'act-existing' });

      await deduplicateActivity(PROFILE_ID, baseParsed, HASH);

      expect(findImportJobByHash).toHaveBeenCalledWith(HASH, PROFILE_ID);
    });

    it('skips hash check when rawPayloadHash is undefined', async () => {
      vi.mocked(findSimilarActivity).mockResolvedValue(null);

      await deduplicateActivity(PROFILE_ID, baseParsed, undefined);

      expect(findImportJobByHash).not.toHaveBeenCalled();
    });

    it('does not short-circuit when hash exists but activityId is null', async () => {
      vi.mocked(findImportJobByHash).mockResolvedValue({ activityId: null });
      vi.mocked(findSimilarActivity).mockResolvedValue(null);

      const result = await deduplicateActivity(PROFILE_ID, baseParsed, HASH);

      expect(result.isDuplicate).toBe(false);
      expect(findSimilarActivity).toHaveBeenCalled();
    });

    it('returns isDuplicate: false when no hash match exists', async () => {
      vi.mocked(findImportJobByHash).mockResolvedValue(null);
      vi.mocked(findSimilarActivity).mockResolvedValue(null);

      const result = await deduplicateActivity(PROFILE_ID, baseParsed, HASH);

      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('similarity check', () => {
    beforeEach(() => {
      vi.mocked(findImportJobByHash).mockResolvedValue(null);
    });

    it('returns isDuplicate: true when a similar activity exists', async () => {
      vi.mocked(findSimilarActivity).mockResolvedValue({ id: 'act-similar' });

      const result = await deduplicateActivity(PROFILE_ID, baseParsed, HASH);

      expect(result.isDuplicate).toBe(true);
      if (result.isDuplicate) {
        expect(result.existingActivityId).toBe('act-similar');
        expect(result.reason).toContain('startTime');
      }
    });

    it('passes correct sport to findSimilarActivity', async () => {
      vi.mocked(findSimilarActivity).mockResolvedValue(null);

      await deduplicateActivity(PROFILE_ID, { ...baseParsed, sport: 'cycling' }, HASH);

      expect(findSimilarActivity).toHaveBeenCalledWith(
        expect.objectContaining({ sport: 'Cycling' }),
      );
    });

    it('passes correct startTime and durationSeconds to findSimilarActivity', async () => {
      vi.mocked(findSimilarActivity).mockResolvedValue(null);
      const startTime = new Date('2026-06-22T07:30:00Z');

      await deduplicateActivity(PROFILE_ID, { ...baseParsed, startTime, durationSeconds: 3600 });

      expect(findSimilarActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime,
          durationSeconds: 3600,
          athleteProfileId: PROFILE_ID,
        }),
      );
    });

    it('returns isDuplicate: false when no similar activity exists', async () => {
      vi.mocked(findSimilarActivity).mockResolvedValue(null);

      const result = await deduplicateActivity(PROFILE_ID, baseParsed);

      expect(result.isDuplicate).toBe(false);
    });

    it('returns isDuplicate: false for unknown sport (skips similarity check)', async () => {
      vi.mocked(findSimilarActivity).mockResolvedValue(null);

      const result = await deduplicateActivity(
        PROFILE_ID,
        { ...baseParsed, sport: 'yoga' },
        undefined,
      );

      expect(result.isDuplicate).toBe(false);
      expect(findSimilarActivity).not.toHaveBeenCalled();
    });
  });

  describe('priority: hash check before similarity check', () => {
    it('returns hash match without running similarity check', async () => {
      vi.mocked(findImportJobByHash).mockResolvedValue({ activityId: 'act-hash-match' });

      const result = await deduplicateActivity(PROFILE_ID, baseParsed, HASH);

      expect(result.isDuplicate).toBe(true);
      expect(findSimilarActivity).not.toHaveBeenCalled();
    });
  });

  describe('all sports map correctly for similarity check', () => {
    const sportPairs: Array<[string, string]> = [
      ['running', 'Running'],
      ['cycling', 'Cycling'],
      ['swimming', 'Swimming'],
      ['strength', 'Strength'],
      ['mobility', 'Mobility'],
      ['other', 'Other'],
    ];

    for (const [input, expected] of sportPairs) {
      it(`maps '${input}' to Prisma '${expected}'`, async () => {
        vi.mocked(findImportJobByHash).mockResolvedValue(null);
        vi.mocked(findSimilarActivity).mockResolvedValue(null);

        await deduplicateActivity(PROFILE_ID, { ...baseParsed, sport: input });

        expect(findSimilarActivity).toHaveBeenCalledWith(
          expect.objectContaining({ sport: expected }),
        );
      });
    }
  });
});
