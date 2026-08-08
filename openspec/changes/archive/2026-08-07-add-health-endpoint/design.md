## Context

See proposal.md - Why. The monitoring layer already bridges Pino logs to the Sentry/Rustrak backend via `pinoIntegration` (`src/lib/monitoring/sentry.ts:62,94`), and the app logger is a Pino singleton at `src/shared/utils/logger-util.ts`. A public health route is the smallest surface to exercise that pipeline deterministically.

## Goals / Non-Goals

**Goals:**

- Expose `GET /api/health` as a public, unauthenticated liveness route.
- Emit one `info`-level structured log per request so the pino→Sentry→Rustrak pipeline can be verified end-to-end.
- Follow the existing API route conventions (envelope, error mapping, JSDoc).

**Non-Goals:**

- No health-check of external dependencies (DB/cache) — liveness only, matching the smoke-test purpose.
- No auth changes, schema changes, or new dependencies.
- No changes to the monitoring SDK wiring itself.

## Decisions

**Plain handler with `withErrorHandling`.**
The route has no params/query/body to validate, so `withZodValidation` adds nothing. Use `withErrorHandling` for consistent envelope + error mapping, or a plain `APIRoute` with a manual try/catch like `src/pages/api/music/index.ts`. Keep it a plain handler returning `createSuccessResponse` with `{ status: 'ok' }`; emit `logger.info({ route: '/api/health' }, 'Health check requested')` before returning.

**Add `/api/health` to `publicRoutes`.**
Matching is prefix-based (`isPublicRoute`); adding the exact route string is sufficient and consistent with `/api/music`, `/api/anime`.

**Log level `info`.**
Matches the production default (`logger` runs at `info` in `NODE_ENV=production`, `src/shared/utils/logger-util.ts:33`), so the log is actually forwarded in production rather than being dropped at `debug`.

## Risks / Trade-offs

- A health endpoint can be called frequently and spam logs → the log line is single and short; if it becomes noisy, add a sampling flag later (out of scope).
- Public liveness routes are harmless — they expose no data, only `200` + `status: ok`.
