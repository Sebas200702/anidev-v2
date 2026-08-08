## Why

Rustrak shows "Events: 0" even with `SENTRY_DSN` configured and the container restarted. The pino→Sentry→Rustrak log pipeline needs an end-to-end smoke test: a way to deterministically emit an `info`-level log and confirm it lands in Rustrak. There is currently no route that does this.

## What Changes

- Add a public `GET /api/health` API route that:
  - Returns `200 OK` with the standard envelope (`{ data, status }`).
  - Emits an `info`-level structured log via the app logger (`@utils/logger-util`) each time it is called, which the pino → Sentry bridge (`pinoIntegration`) forwards to Rustrak when a DSN is set.
- Register `/api/health` in `src/config/public-routes.ts` so it is reachable without a session.
- Add a Vitest test asserting the route logs at `info` level and returns the expected envelope (TDD).

## Capabilities

### New Capabilities

- `infrastructure/monitoring`: Add a requirement for a public health endpoint that exercises the log pipeline by emitting an `info`-level log on each request.

### Modified Capabilities

None.

## Impact

- `src/pages/api/health.ts` — new route.
- `src/config/public-routes.ts` — add `/api/health` to the allowlist.
- `src/shared/__tests__/` or route-level `__tests__` — new Vitest coverage.
- No dependency, schema, or auth changes.
