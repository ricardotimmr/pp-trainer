import { ImportNotImplementedError, type ActivityImporter } from '../ActivityImporter.js';
import type { ParsedActivity } from '../types.js';

// Implemented in P4-008.
export class TcxParser implements ActivityImporter {
  readonly source = 'ManualTcxUpload' as const;

  async parse(_input: unknown): Promise<ParsedActivity> {
    throw new ImportNotImplementedError(this.source);
  }
}
