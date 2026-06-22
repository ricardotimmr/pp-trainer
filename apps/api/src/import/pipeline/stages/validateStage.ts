import type { ImportSourceType } from '../../types.js';

export type ValidateStageInput = {
  source: ImportSourceType;
  input: unknown;
};

// Implemented per-source in P4-003 (JSON) and P4-006 (files).
// Currently a pass-through — source-specific validation lives in the parsers.
export function validateStage(_input: ValidateStageInput): void {
  // no-op until parsers implement their own Zod validation
}
