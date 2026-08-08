## 1. Health route (TDD)

- [x] 1.1 Write a failing Vitest test for `GET /api/health`: it calls the handler, asserts `200` with envelope `{ data: { status: 'ok' }, status: 200 }`, and asserts the logger records an `info`-level message (spy on `logger.info`)
- [x] 1.2 Implement `src/pages/api/health.ts`: public `GET` route that logs `info` and returns the envelope (JSDoc `@module`, response/error contract)

## 2. Public route registration

- [x] 2.1 Add `/api/health` to `publicRoutes` in `src/config/public-routes.ts` and update the `@module`/`@remarks` docs

## 3. Verify and release

- [ ] 3.1 Run the Verification gate (`format → check → check:types → test → build`)
- [ ] 3.2 Smoke-test locally with `ASTRO_ADAPTER=bun` (dev or built server) hitting `/api/health` and confirming the `info` log line appears
- [ ] 3.3 Open a PR to `master` on branch `feat/health-endpoint`, run `bun run release:minor` on the branch, merge, and push the tag to rebuild the Docker image; then confirm the request appears in Rustrak
