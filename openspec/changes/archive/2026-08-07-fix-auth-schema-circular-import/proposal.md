## Why

Production crashes at runtime with `ReferenceError: Cannot access 'user' before initialization`. The build output chunk `auth-schema_*.mjs` hoists the Drizzle `relations(user, ...)` calls before the `const user` table declarations. Root cause: a circular import between `auth-schema.ts` and `auth-relations.ts`.

- `auth-relations.ts` imports `{ account, session, user }` from `@db/schemas/auth-schema`.
- `auth-schema.ts` re-exports `{ userRelations, sessionRelations, accountRelations }` from `@db/schemas/auth-relations` at the bottom (line 145-149).

The re-export makes `auth-schema` depend on `auth-relations`, which depends back on `auth-schema`. The bundler flattens the cycle into one chunk and, depending on platform/ordering, evaluates the relations before the tables — a classic TDZ bug. It works in dev (lazy resolution) and in some local builds, but fails in the Linux/Docker production bundle.

## What Changes

- Delete the trailing re-export block in `src/lib/db/schemas/auth-schema.ts` (lines 145-149).
- In `src/lib/db/schemas/index.ts`, split the auth export into two lines:
  - `export { user, session, account, verification } from './auth-schema'`
  - `export { userRelations, sessionRelations, accountRelations } from './auth-relations'`
- Dependency direction becomes one-way: `auth-relations → auth-schema` (tables), with `index.ts` importing relations directly from `auth-relations`. No cycle.
- Public symbols remain identical — only the module that re-exports the relations changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Internal module-structure refactor; external behavior unchanged. Declared via `skip_specs: true` in `.openspec.yaml`.

## Impact

- `src/lib/db/schemas/auth-schema.ts` — removes the relations re-export (fixes the cycle).
- `src/lib/db/schemas/index.ts` — imports relations from `./auth-relations` directly.
- No other file imports the relations from `auth-schema` (verified: only the barrel does), so no consumer breaks.
- Production Docker image must be rebuilt (new release tag) to pick up the fix.
