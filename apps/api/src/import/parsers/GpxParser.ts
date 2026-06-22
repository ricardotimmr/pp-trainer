import { ImportNotImplementedError, type ActivityImporter } from '../ActivityImporter.js';
import type { ParsedActivity } from '../types.js';

// Implemented in P4-008.
export class GpxParser implements ActivityImporter {
  readonly source = 'ManualGpxUpload' as const;

  async parse(_input: unknown): Promise<ParsedActivity> {
    throw new ImportNotImplementedError(this.source);
  }
}
