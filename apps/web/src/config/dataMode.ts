export type DataMode = 'mock' | 'api';

export const DATA_MODE: DataMode =
  (import.meta.env.VITE_DATA_MODE as string | undefined) === 'api'
    ? 'api'
    : 'mock';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://127.0.0.1:3000';
