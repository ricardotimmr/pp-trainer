import { getActivePrototypeFixtureKey } from './prototypeData.fixtures';
import type { DataSourceType } from './prototypeData.types';

export type ImportHistoryRow = {
  source: DataSourceType;
  status: 'Queued' | 'Validated' | 'Blocked';
  activities: number;
  timestamp: string;
  note: string;
};

const defaultImportHistoryRows: ImportHistoryRow[] = [
  {
    source: 'garmin_unofficial',
    status: 'Validated',
    activities: 8,
    timestamp: 'Prototype sample',
    note: 'Representative Garmin sync batch with streams, laps and zones.',
  },
  {
    source: 'manual_fit_upload',
    status: 'Queued',
    activities: 1,
    timestamp: 'Future upload',
    note: 'Single FIT activity awaiting parser integration.',
  },
  {
    source: 'manual_json_import',
    status: 'Blocked',
    activities: 0,
    timestamp: 'Dev fixture',
    note: 'Missing activity start time in example JSON payload.',
  },
];

export function getImportHistoryRows(): ImportHistoryRow[] {
  if (getActivePrototypeFixtureKey() === 'import_empty_history') {
    return [];
  }

  return [...defaultImportHistoryRows];
}
