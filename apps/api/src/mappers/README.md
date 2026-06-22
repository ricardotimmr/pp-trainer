# mappers/

Mappers convert Prisma model types into DTO types for API responses.

**Rules:**
- Import DTO types from `@pp-trainer/shared`
- Accept Prisma model types as input — never return them
- No database access, no business logic
- Named as `map<Entity>.ts`, e.g. `mapAthleteProfile.ts`
