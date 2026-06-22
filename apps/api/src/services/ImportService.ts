import type { ImportHistoryResponseDto } from '@pp-trainer/shared';

import { mapImportHistoryItem } from '../mappers/mapImport.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as ImportRepository from '../repositories/ImportRepository.js';

export async function getImportHistory(): Promise<ImportHistoryResponseDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();

  if (!profile) {
    return { imports: [] };
  }

  const files = await ImportRepository.findImportHistory(profile.id);

  return { imports: files.map(mapImportHistoryItem) };
}
