import type { ImportSourceType, ParsedActivity } from './types.js';

/**
 * All import sources implement this interface.
 *
 * Each parser receives raw input (JSON object or file buffer), validates it
 * for the source format, and returns a source-agnostic ParsedActivity.
 *
 * The ParsedActivity is then passed to ActivityNormalizer, which maps it to
 * the Prisma Activity write shape. The pipeline stages after parsing are
 * identical for all sources.
 *
 * Pipeline:
 *   validate → parse (this interface) → store-raw → normalize →
 *   deduplicate → store-activity → update-job → return-result
 */
export interface ActivityImporter {
  readonly source: ImportSourceType;
  parse(input: unknown): Promise<ParsedActivity>;
}

export class ImportNotImplementedError extends Error {
  constructor(source: string) {
    super(`Parser for source '${source}' is not implemented yet.`);
    this.name = 'ImportNotImplementedError';
  }
}
