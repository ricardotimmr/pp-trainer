import type { ActivityImporter } from '../../ActivityImporter.js';
import { JsonActivityParser } from '../../parsers/JsonActivityParser.js';
import type { ImportSourceType, ParsedActivity } from '../../types.js';

const registry = new Map<ImportSourceType, ActivityImporter>();

// Registered parsers — add new ones here as they're implemented
registerParser('ManualJsonImport', new JsonActivityParser());

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
