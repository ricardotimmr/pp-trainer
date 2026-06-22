import { ImportNotImplementedError, type ActivityImporter } from '../ActivityImporter.js';
import type { ParsedActivity } from '../types.js';

// Implemented in P4-007.
export class FitParser implements ActivityImporter {
  readonly source = 'ManualFitUpload' as const;

  async parse(_input: unknown): Promise<ParsedActivity> {
    throw new ImportNotImplementedError(this.source);
  }
}
