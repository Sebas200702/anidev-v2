## Context

See proposal.md - Why. `@sentry/astro` injects `sentry.server.config` via `injectScript('page-ssr', ...)` (confirmed in `node_modules/@sentry/astro/build/esm/integration/index.js`), so `initAstroSentry()` runs only on SSR page renders, never for API endpoints. The health endpoint verified this: Rustrak received `POST /api/1/envelope/` only after loading a page, never from `/api/health` alone.

## Goals / Non-Goals

**Goals:**

- Initialize the monitoring SDK before any route handler — page or API — runs.
- Make `initAstroSentry()` idempotent so middleware + page injection don't double-init.
- Keep no-op behavior when `SENTRY_DSN` is unset.

**Non-Goals:**

- No changes to the DSN, SDK versions, or the `sentry.server.config` bootstrap.
- No changes to log leveling or the pino bridge itself.
- No changes to the API route patterns.

## Decisions

**Initialize from the Astro middleware module.**
The session middleware (`src/middleware/auth-middleware.ts`, registered in `astro.config.mjs` via `sessionMiddlewareIntegration`) runs on every request — pages and API endpoints. Adding a module-level `initAstroSentry()` import there guarantees SDK init before any handler, independent of `@sentry/astro`'s page-only injection.

Alternative considered: importing the bootstrap in each API route — rejected, too invasive and error-prone (every new route must remember to import it). Alternative: importing `sentry.server.config` from a shared barrel — rejected, middleware is the single always-executed entry point.

**Guard `initAstroSentry()` for idempotency.**
Both the middleware and `@sentry/astro`'s page injection will call it. A module-level `isInitialized` flag (or checking SDK state) makes the second call a no-op. `initServerSentry` already effectively guards via SDK init semantics, but the explicit flag keeps behavior deterministic and testable.

**Call `initAstroSentry()` (not `initServerSentry`) in the middleware.**
The middleware is Astro SSR context, matching the `initAstroSentry` SDK variant already used by `sentry.server.config.ts`.

## Risks / Trade-offs

- Middleware now has a monitoring side effect → it's an explicit, documented import with a guard; no new failure surface since init never throws and no-ops without DSN.
- Page + middleware double-call → the idempotency guard makes it a single init; covered by a new test.
- The health endpoint remains page-independent, so production logs flow to Rustrak on first API call — closing the "Events: 0" gap.
