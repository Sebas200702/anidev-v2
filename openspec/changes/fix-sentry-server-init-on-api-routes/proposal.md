## Why

The `GET /api/health` endpoint logs at `info` level on every request, but in production the log never reaches Rustrak. Root cause: `@sentry/astro` injects `sentry.server.config` only via `injectScript('page-ssr', ...)`, so the SDK initializes (`initAstroSentry()`) only when an SSR **page** (`.astro`) renders — never for **API endpoints** (`src/pages/api/*.ts`). If the first request is `/api/health` (or any API route), `initAstroSentry()` never runs and the pino→Sentry bridge is never wired, so logs stay in stdout only.

## What Changes

- Ensure `initAstroSentry()` runs before any route handling, including API endpoints, by calling it at Astro **middleware** startup (the middleware module already executes on every request — page or API).
- The middleware module imports the monitoring bootstrap; `initAstroSentry()` stays idempotent/no-op when `SENTRY_DSN` is unset (unchanged behavior).
- Keep `sentry.server.config` as-is for page-side injection (harmless duplicate; `initAstroSentry` must tolerate being called twice).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `infrastructure/monitoring`: Add requirement that the monitoring SDK initializes before any request (page or API) is handled.

## Impact

- `src/middleware/auth-middleware.ts` — import + call the monitoring init at module load (middleware runs for all routes).
- `src/lib/monitoring/sentry.ts` — make `initAstroSentry` idempotent (guard against double-init from page + middleware).
- `src/lib/monitoring/__tests__/sentry.test.ts` — extend coverage for the double-init guard.
- No DSN, SDK, or route changes.
