import { API_BASE_URL } from '../config/dataMode';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ApiFetchInit = RequestInit & {
  // Status codes that should not throw even when !response.ok
  acceptedStatuses?: number[];
};

export async function apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const { acceptedStatuses, ...fetchInit } = init ?? {};
  const response = await fetch(`${API_BASE_URL}${path}`, fetchInit);

  if (!response.ok && !acceptedStatuses?.includes(response.status)) {
    let code = 'UNKNOWN_ERROR';
    let message = `HTTP ${response.status}`;
    let details: unknown;
    try {
      const body = (await response.json()) as {
        error?: { code?: string; message?: string; details?: unknown };
      };
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
      details = body.error?.details;
    } catch {
      // use defaults
    }
    throw new ApiClientError(response.status, code, message, details);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
