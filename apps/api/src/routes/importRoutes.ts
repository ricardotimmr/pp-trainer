import type { FastifyInstance } from 'fastify';

import * as ImportService from '../services/ImportService.js';

const NOT_IMPLEMENTED_BODY = {
  error: {
    code: 'NOT_IMPLEMENTED',
    message:
      'File upload and parsing are not supported in Phase 3. Activity import will be implemented in Phase 4.',
  },
} as const;

const JSON_IMPORT_NOT_IMPLEMENTED_BODY = {
  error: {
    code: 'NOT_IMPLEMENTED',
    message: 'JSON activity import is not yet implemented. Coming in P4-003.',
  },
} as const;

const FILE_IMPORT_NOT_IMPLEMENTED_BODY = {
  error: {
    code: 'NOT_IMPLEMENTED',
    message: 'File upload and parsing are not yet implemented. Coming in P4-006/P4-007/P4-008.',
  },
} as const;

export async function importRoutes(app: FastifyInstance): Promise<void> {
  // Phase 3 placeholder — kept for backwards compatibility
  app.get('/api/import/history', async () => {
    return ImportService.getImportHistory();
  });

  // Phase 3 placeholder — superseded by /api/imports/activity-file below
  app.post('/api/import/upload', async (_request, reply) => {
    return reply.status(501).send(NOT_IMPLEMENTED_BODY);
  });

  // Phase 4 import endpoints (P4-003 and P4-006 will replace these stubs)
  app.post('/api/imports/activity-json', async (_request, reply) => {
    return reply.status(501).send(JSON_IMPORT_NOT_IMPLEMENTED_BODY);
  });

  app.post('/api/imports/activity-file', async (_request, reply) => {
    return reply.status(501).send(FILE_IMPORT_NOT_IMPLEMENTED_BODY);
  });
}
