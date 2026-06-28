import type { ActivityImporter } from '../ActivityImporter.js';
import type { ImportSourceType, ParsedActivity } from '../types.js';

export class StravaParsedActivityImporter implements ActivityImporter {
  readonly source: ImportSourceType = 'Strava';

  async parse(input: unknown): Promise<ParsedActivity> {
    // Input is already a ParsedActivity, mapped by StravaActivityMapper
    // before being passed to runImportPipeline.
    return input as ParsedActivity;
  }
}
