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
  findActivityByExternalId: vi.fn(),
}));

const { findImportJobByHash } = await import('../../repositories/ImportJobRepository.js');
const { findSimilarActivity, findActivityByExternalId } = await import(
  '../../repositories/ActivityRepository.js'
);

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

  describe('externalId check', () => {
    it('returns isDuplicate: true when externalId matches existing activity', async () => {
      vi.mocked(findActivityByExternalId).mockResolvedValue({ id: 'act-ext-123' });

      const result = await deduplicateActivity(
        PROFILE_ID,
        { ...baseParsed, source: 'GarminUnofficial', externalId: 'garmin-ext-999' },
        HASH,
      );

      expect(result.isDuplicate).toBe(true);
      if (result.isDuplicate) {
        expect(result.existingActivityId).toBe('act-ext-123');
        expect(result.reason).toContain('externalId');
      }
    });

    it('skips hash and similarity checks when externalId match is found', async () => {
      vi.mocked(findActivityByExternalId).mockResolvedValue({ id: 'act-ext-123' });

      await deduplicateActivity(
        PROFILE_ID,
        { ...baseParsed, source: 'GarminUnofficial', externalId: 'garmin-ext-999' },
        HASH,
      );

      expect(findImportJobByHash).not.toHaveBeenCalled();
      expect(findSimilarActivity).not.toHaveBeenCalled();
    });

    it('continues to hash check when externalId not found', async () => {
      vi.mocked(findActivityByExternalId).mockResolvedValue(null);
      vi.mocked(findImportJobByHash).mockResolvedValue(null);
      vi.mocked(findSimilarActivity).mockResolvedValue(null);

      await deduplicateActivity(
        PROFILE_ID,
        { ...baseParsed, source: 'GarminUnofficial', externalId: 'garmin-ext-999' },
        HASH,
      );

      expect(findImportJobByHash).toHaveBeenCalled();
    });

    it('skips externalId check when externalId is absent', async () => {
      vi.mocked(findImportJobByHash).mockResolvedValue(null);
      vi.mocked(findSimilarActivity).mockResolvedValue(null);

      await deduplicateActivity(PROFILE_ID, baseParsed, HASH);

      expect(findActivityByExternalId).not.toHaveBeenCalled();
    });
  });

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

  describe('cross-source deduplication scenarios', () => {
    beforeEach(() => {
      vi.mocked(findActivityByExternalId).mockResolvedValue(null);
      vi.mocked(findImportJobByHash).mockResolvedValue(null);
    });

    it('Garmin sync twice: externalId match catches duplicate', async () => {
      vi.mocked(findActivityByExternalId).mockResolvedValue({ id: 'act-garmin-1' });

      const result = await deduplicateActivity(
        PROFILE_ID,
        { ...baseParsed, source: 'GarminUnofficial', externalId: 'garmin-12345' },
      );

      expect(result.isDuplicate).toBe(true);
      if (result.isDuplicate) {
        expect(result.existingActivityId).toBe('act-garmin-1');
        expect(result.reason).toContain('externalId');
      }
      expect(findSimilarActivity).not.toHaveBeenCalled();
    });

    it('Strava sync twice: externalId match catches duplicate', async () => {
      vi.mocked(findActivityByExternalId).mockResolvedValue({ id: 'act-strava-1' });

      const result = await deduplicateActivity(
        PROFILE_ID,
        { ...baseParsed, source: 'Strava', externalId: 'strava-99887766' },
      );

      expect(result.isDuplicate).toBe(true);
      if (result.isDuplicate) {
        expect(result.existingActivityId).toBe('act-strava-1');
        expect(result.reason).toContain('externalId');
      }
    });

    it('Garmin FIT upload then Garmin sync: similarity check catches duplicate', async () => {
      // FIT upload has no externalId (Garmin Connect ID is not in the FIT file)
      vi.mocked(findSimilarActivity).mockResolvedValue({ id: 'act-fit-1' });

      const result = await deduplicateActivity(
        PROFILE_ID,
        { ...baseParsed, source: 'GarminUnofficial', externalId: 'garmin-sync-id' },
        undefined,
      );

      // externalId check runs but finds nothing (different source stored it as ManualFitUpload)
      // similarity check catches it
      expect(result.isDuplicate).toBe(true);
      if (result.isDuplicate) {
        expect(result.existingActivityId).toBe('act-fit-1');
        expect(result.reason).toContain('startTime');
      }
    });

    it('Garmin sync then Strava sync of same activity: similarity check catches duplicate', async () => {
      // Strava activity has different externalId than Garmin — externalId check will find nothing
      vi.mocked(findSimilarActivity).mockResolvedValue({ id: 'act-garmin-2' });

      const result = await deduplicateActivity(
        PROFILE_ID,
        { ...baseParsed, source: 'Strava', externalId: 'strava-different-id' },
      );

      expect(result.isDuplicate).toBe(true);
      if (result.isDuplicate) {
        expect(result.existingActivityId).toBe('act-garmin-2');
        expect(result.reason).toContain('startTime');
      }
    });

    it('two different 60-min runs on the same day are NOT flagged as duplicates', async () => {
      vi.mocked(findSimilarActivity).mockResolvedValue(null);

      const run1 = { ...baseParsed, startTime: new Date('2026-06-22T07:00:00Z'), durationSeconds: 3600 };
      const run2 = { ...baseParsed, startTime: new Date('2026-06-22T18:30:00Z'), durationSeconds: 3600 };

      const [result1, result2] = await Promise.all([
        deduplicateActivity(PROFILE_ID, run1),
        deduplicateActivity(PROFILE_ID, run2),
      ]);

      expect(result1.isDuplicate).toBe(false);
      expect(result2.isDuplicate).toBe(false);
    });

    it('forceImport: true bypasses all dedup checks (handled in pipeline, not deduplicateActivity)', async () => {
      // Note: forceImport skipping is done in deduplicateStage / runImportPipeline,
      // not inside deduplicateActivity itself. Verify that deduplicateActivity still
      // returns isDuplicate: true so the caller can decide.
      vi.mocked(findActivityByExternalId).mockResolvedValue({ id: 'act-existing' });

      const result = await deduplicateActivity(
        PROFILE_ID,
        { ...baseParsed, source: 'Strava', externalId: 'strava-abc' },
      );

      // deduplicateActivity always reports the truth — the pipeline skips based on forceImport
      expect(result.isDuplicate).toBe(true);
    });

    it('externalId check short-circuits before hash and similarity checks', async () => {
      vi.mocked(findActivityByExternalId).mockResolvedValue({ id: 'act-fast' });

      await deduplicateActivity(
        PROFILE_ID,
        { ...baseParsed, source: 'GarminUnofficial', externalId: 'g-111' },
        'some-hash',
      );

      expect(findImportJobByHash).not.toHaveBeenCalled();
      expect(findSimilarActivity).not.toHaveBeenCalled();
    });

    it('activities within 30s window are flagged as duplicates', async () => {
      vi.mocked(findSimilarActivity).mockResolvedValue({ id: 'act-close' });

      await deduplicateActivity(
        PROFILE_ID,
        { ...baseParsed, startTime: new Date('2026-06-22T07:30:25Z') },
      );

      // findSimilarActivity receives the startTime — the ±30s window is applied at DB level
      expect(findSimilarActivity).toHaveBeenCalledWith(
        expect.objectContaining({ startTime: new Date('2026-06-22T07:30:25Z') }),
      );
    });
  });
});
