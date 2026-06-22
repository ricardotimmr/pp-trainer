import type { FastifyInstance } from 'fastify';

import * as ImportService from '../services/ImportService.js';

const NOT_IMPLEMENTED_BODY = {
  error: {
    code: 'NOT_IMPLEMENTED',
    message:
      'File upload and parsing are not supported in Phase 3. Activity import will be implemented in Phase 4.',
  },
} as const;

export async function importRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/import/history', async () => {
    return ImportService.getImportHistory();
  });

  app.post('/api/import/upload', async (_request, reply) => {
    return reply.status(501).send(NOT_IMPLEMENTED_BODY);
  });
}
