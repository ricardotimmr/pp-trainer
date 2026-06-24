export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'BAD_GATEWAY'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'UNPROCESSABLE';

const HTTP_STATUS_MAP: Record<ApiErrorCode, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  BAD_GATEWAY: 502,
  RATE_LIMITED: 429,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
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

  static forbidden(message = 'Access denied'): ApiError {
    return new ApiError('FORBIDDEN', message);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError('BAD_REQUEST', message, details);
  }

  static validationError(message: string, details?: unknown): ApiError {
    return new ApiError('VALIDATION_ERROR', message, details);
  }

  static internalError(message = 'Internal server error'): ApiError {
    return new ApiError('INTERNAL_SERVER_ERROR', message);
  }

  static serviceUnavailable(message = 'Service unavailable'): ApiError {
    return new ApiError('SERVICE_UNAVAILABLE', message);
  }

  static badGateway(message = 'AI provider request failed — please try again'): ApiError {
    return new ApiError('BAD_GATEWAY', message);
  }

  static rateLimited(message = 'Too many requests — please try again later'): ApiError {
    return new ApiError('RATE_LIMITED', message);
  }

  static conflict(message: string): ApiError {
    return new ApiError('CONFLICT', message);
  }

  static unprocessable(message: string, details?: unknown): ApiError {
    return new ApiError('UNPROCESSABLE', message, details);
  }
}
