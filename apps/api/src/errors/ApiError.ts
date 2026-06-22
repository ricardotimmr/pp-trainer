export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'INTERNAL_SERVER_ERROR';

const HTTP_STATUS_MAP: Record<ApiErrorCode, number> = {
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = HTTP_STATUS_MAP[code];
    this.details = details;
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError('NOT_FOUND', message);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError('BAD_REQUEST', message, details);
  }

  static validationError(message: string, details?: unknown): ApiError {
    return new ApiError('VALIDATION_ERROR', message, details);
  }
}
