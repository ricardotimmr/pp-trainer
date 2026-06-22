import { API_BASE_URL } from '../config/dataMode';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
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
    try {
      const body = (await response.json()) as {
        error?: { code?: string; message?: string };
      };
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch {
      // use defaults
    }
    throw new ApiClientError(response.status, code, message);
  }

  return response.json() as Promise<T>;
}
