# @pp-trainer/shared

Shared types and Zod schemas used by both `apps/web` and `apps/api`.

## What belongs here

- Zod schemas for DTOs that cross the API boundary
- TypeScript types derived from those schemas (`z.infer<typeof XxxSchema>`)
- Enums that both frontend and backend reference (sport types, workout statuses, goal priorities, etc.)

## What does NOT belong here

- Prisma models or any `@prisma/client` imports — those stay in `apps/api`
- Business logic, service functions, or helper utilities
- Frontend-only or backend-only types

## No-active-plan contract

`currentTrainingPlan` in API responses is typed as `TrainingPlanDto | null`.

`null` means no active plan exists — this is a normal product state, not an error.
Routes and services must NOT return a 404 for this case. The service returns `null`,
the route sends `{ currentTrainingPlan: null }` with status 200.
