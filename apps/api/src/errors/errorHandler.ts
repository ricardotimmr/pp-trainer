import type { FastifyError, FastifyInstance } from 'fastify';

import { ApiError } from './ApiError.js';

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

function buildErrorBody(
  code: string,
  message: string,
  details?: unknown,
): ApiErrorBody {
  return {
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
}

export function setupErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler((_request, reply) => {
    void reply.status(404).send(buildErrorBody('NOT_FOUND', 'Route not found'));
  });

  app.setErrorHandler<FastifyError>((error, _request, reply) => {
    if (error instanceof ApiError) {
      void reply
        .status(error.statusCode)
        .send(buildErrorBody(error.code, error.message, error.details));
      return;
    }

    // Fastify schema validation errors
    if (error.validation) {
      void reply
        .status(400)
        .send(buildErrorBody('VALIDATION_ERROR', 'Validation failed', error.validation));
      return;
    }

    // Fastify HTTP errors (e.g. 405 Method Not Allowed)
    if (error.statusCode != null && error.statusCode < 500) {
      void reply
        .status(error.statusCode)
        .send(buildErrorBody('BAD_REQUEST', error.message));
      return;
    }

    app.log.error({ err: error }, 'Unexpected error');
    void reply
      .status(500)
      .send(buildErrorBody('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'));
  });
}
