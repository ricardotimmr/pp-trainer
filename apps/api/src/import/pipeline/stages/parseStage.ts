import type { ActivityImporter } from '../../ActivityImporter.js';
import type { ImportSourceType, ParsedActivity } from '../../types.js';

// Parser registry — populated as parsers are implemented in P4-003/P4-007/P4-008.
const registry = new Map<ImportSourceType, ActivityImporter>();

export function registerParser(source: ImportSourceType, parser: ActivityImporter): void {
  registry.set(source, parser);
}

export async function parseStage(source: ImportSourceType, input: unknown): Promise<ParsedActivity> {
  const parser = registry.get(source);

  if (parser == null) {
    const { ImportNotImplementedError } = await import('../../ActivityImporter.js');
    throw new ImportNotImplementedError(source);
  }

  return parser.parse(input);
}
