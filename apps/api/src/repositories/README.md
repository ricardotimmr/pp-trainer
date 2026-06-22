# repositories/

Repositories own all Prisma access. Every database query lives here.

**Rules:**
- Import `prisma` from `../lib/prisma.js`
- Return raw Prisma model types — not DTOs
- No business logic, no error handling beyond re-throwing
- Named as `<Entity>Repository.ts`, e.g. `AthleteRepository.ts`
