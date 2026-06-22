import { ImportNotImplementedError, type ActivityImporter } from '../ActivityImporter.js';
import type { ParsedActivity } from '../types.js';

// Implemented in P4-003.
export class JsonActivityParser implements ActivityImporter {
  readonly source = 'ManualJsonImport' as const;

  async parse(_input: unknown): Promise<ParsedActivity> {
    throw new ImportNotImplementedError(this.source);
  }
}
