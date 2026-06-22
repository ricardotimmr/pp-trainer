# services/

Services own business logic and call repositories for data access.

**Rules:**
- Import from `repositories/`, never from `lib/prisma.js` directly
- Return DTO types from `@pp-trainer/shared` or backend-internal types
- Optional/absent resources return `null` or empty-state DTOs — do NOT throw `ApiError.notFound()` for expected-absent states (e.g. no active training plan)
- Named as `<Entity>Service.ts`, e.g. `AthleteService.ts`
