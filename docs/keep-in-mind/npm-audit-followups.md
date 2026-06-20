# npm Audit Follow-ups

## Prisma 7 transitive `@hono/node-server` finding

Status: accepted temporary upstream dev-tooling finding.

Current chain:

- `prisma@7.8.0`
- `@prisma/dev@0.24.3`
- `@hono/node-server@1.19.11`

`npm audit` reports a moderate advisory for `@hono/node-server <1.19.13`.
The affected package is pulled through Prisma's internal development tooling.
The application does not use Hono directly, does not run Hono as the API server
and does not expose Hono static-file middleware.

Do not run `npm audit fix --force` for this finding right now. npm proposes a
Prisma downgrade to `6.19.3`, which would undo the current Prisma 7 setup and
is a higher project risk than the remaining moderate dev-tooling advisory.

Revisit when Prisma releases a version that updates `@prisma/dev` to use
`@hono/node-server >=1.19.13`.
