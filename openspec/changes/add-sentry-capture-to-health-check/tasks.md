## 1. Explicit Sentry event in health check (TDD)

- [x] 1.1 Write a failing Vitest test in `src/pages/api/__tests__/health.test.ts`: `GET /api/health` invokes `Sentry.captureMessage` once with a stable message (mock `@sentry/astro`)
- [x] 1.2 Add the `captureMessage` call to `GET /api/health` in `src/pages/api/health.ts`, alongside the existing `logger.info`, and update the `@module` doc

## 2. Verify and release

- [ ] 2.1 Run the Verification gate (`format → check → check:types → test → build`)
- [ ] 2.2 Build with `ASTRO_ADAPTER=bun` and smoke-test that `/api/health` alone produces an `event` envelope to local Rustrak (in addition to the log envelope)
- [ ] 2.3 Open a PR to `master` on branch `fix/health-sentry-capture`, run `bun run release:patch` on the branch, merge, and push the tag to rebuild the Docker image; then confirm `captureMessage` appears in production Rustrak
