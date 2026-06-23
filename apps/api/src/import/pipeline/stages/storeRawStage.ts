import type { ImportSourceType, ImportPipelineContext } from '../../types.js';

export type StoreRawInput = {
  context: ImportPipelineContext;
  source: ImportSourceType;
  rawInput: unknown;
};

// Implemented in P4-003 (JSON raw payload) and P4-006 (file raw storage).
// Returns optional importedFileId for file-based imports.
export async function storeRawStage(_input: StoreRawInput): Promise<{ importedFileId?: string }> {
  return {};
}
