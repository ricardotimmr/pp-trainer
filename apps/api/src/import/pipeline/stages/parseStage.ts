import type { ActivityImporter } from '../../ActivityImporter.js';
import { FitParser } from '../../parsers/FitParser.js';
import { GpxParser } from '../../parsers/GpxParser.js';
import { JsonActivityParser } from '../../parsers/JsonActivityParser.js';
import { TcxParser } from '../../parsers/TcxParser.js';
import type { ImportSourceType, ParsedActivity } from '../../types.js';

const registry = new Map<ImportSourceType, ActivityImporter>();

// Registered parsers — add new ones as they're implemented (P4-007, P4-008)
registerParser('ManualJsonImport', new JsonActivityParser());
registerParser('ManualFitUpload', new FitParser());
registerParser('ManualGpxUpload', new GpxParser());
registerParser('ManualTcxUpload', new TcxParser());

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
