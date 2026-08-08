## 1. Idempotent monitoring init (TDD)

- [x] 1.1 Write a failing Vitest test in `src/lib/monitoring/__tests__/sentry.test.ts`: calling `initAstroSentry()` twice with a DSN invokes `SentryAstro.init` exactly once (guard works)
- [x] 1.2 Add a module-level `hasInitialized` guard to `initAstroSentry` in `src/lib/monitoring/sentry.ts` (no-op on repeat calls)

## 2. Initialize monitoring in the middleware

- [x] 2.1 Import and call `initAstroSentry()` at module load in `src/middleware/auth-middleware.ts`, updating its `@module` doc

## 3. Verify and release

- [x] 3.1 Run the Verification gate (`format → check → check:types → test → build`)
- [x] 3.2 Build with `ASTRO_ADAPTER=bun` and smoke-test that `/api/health` alone (without loading any page) forwards the log to local Rustrak
- [x] 3.3 Open a PR to `master` on branch `fix/sentry-server-init-on-api-routes`, run `bun run release:patch` on the branch, merge, and push the tag to rebuild the Docker image
