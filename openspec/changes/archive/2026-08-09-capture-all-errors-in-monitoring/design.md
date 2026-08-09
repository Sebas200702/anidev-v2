## Context

See proposal.md - Why. Current state: `mapErrorToHttp` (`src/shared/errors/map-error-to-http.ts`) captures only `InfraError` and unknown errors; `ValidationError`, `AuthError`, and `DomainError` only log. The Astro Sentry integration runs with `enabled: { server: true, client: false }` (`astro.config.mjs`) and there is no `sentry.client.config.ts`, so the browser SDK is never loaded. `with-error-handling.ts` imports `logger` from `'better-auth'`, so route errors bypass the pino→Sentry bridge.

## Goals / Non-Goals

**Goals:**
- Every handled error class reported to Rustrak via a single capture chokepoint, with severity matching the HTTP class (4xx → `warning`, 5xx → `error`).
- Browser SDK active on every page when a public DSN is configured; global errors + unhandled rejections captured; zero client bundle impact when unset.
- Route-composition error logs flow through the application logger.

**Non-Goals:**
- No process-level telesemejantes (`uncaughtException`/`unhandledRejection` on the Bun server) — out of scope for this change; unhandled SSR/API errors already bubble to the Astro Sentry middleware.
- No replay/profiling/user-feedback; browser tracing stays off (`tracesSampleRate: 0`).
- No source-map upload config.

## Decisions

**1. Single capture chokepoint in `mapErrorToHttp`.**
All handled errors already funnel through this mapper (via `withErrorHandling` and `withZodValidation`). Capturing there means no route edits. Capture happens after the HTTP mapping decision so the 4xx/5xx level is derived from the response status.
- Alternative considered: capturing inside `mapDomainErrorToHttp`/`mapAuthErrorToHttp`. Rejected: spreads Sentry concerns across two files and the helpers' contract is HTTP mapping only.
- To respect the ≤150-line file rule, add a tiny helper `src/shared/errors/capture-error.ts` (`captureError(error, level)`) wrapping `SentryNode.captureException`; the mapper switches to it and drops its direct Sentry import.

**2. Severity from HTTP class, not error class.**
`ValidationError`/`AuthError`/`DomainError` → `warning`; `InfraError`/unknown → `error`. Rustrak groups by fingerprint (type+message+transaction), so a mistyped anime id stays one grouped issue, filterable by level and excludable from `new_issue` alerts.
- Alternative considered: capture only 5xx. Rejected by decision — full coverage is the goal; `warning` level is the mitigation for noise.

**3. Client SDK via the Astro integration's auto-discovered config file.**
Set `enabled: { server: true, client: true }` in `astro.config.mjs` and create `sentry.client.config.ts` at the project root. The integration finds it by convention and injects it on every page (`injectScript('page', …)`), so no per-page script tags or layout changes. The file calls `Sentry.init` only when `import.meta.env.PUBLIC_SENTRY_DSN` is set.
- The DSN must be a `PUBLIC_`-prefixed Vite var to be exposed to the browser bundle. It is **not** added to `src/config/env.ts` (server-only Zod env); the client file reads `import.meta.env` directly and no-ops when absent.
- `sentry.client.config.ts` deliberately does **not** import `@lib/monitoring/sentry` — that module imports `@config/env` whose eager Zod validation would crash inside the browser bundle.
- `environment` uses `import.meta.env.MODE`; `tracesSampleRate: 0` (errors only, minimal bundle).

**4. Logger import fix in `with-error-handling.ts`.**
Swap `import { logger } from 'better-auth'` → `import { logger } from '@utils/logger-util'` so route-level error logs reach pino and the bridge.

## Risks / Trade-offs

- **4xx issue volume** → Captured at `warning`; Rustrak alerts can target `error` only; issues still group per error type.
- **Browser DSN is public** → Accepted: Sentry DSNs are public ingest keys by design; no secrets on the client.
- **Browser→Rustrak cross-origin** → The browser sends envelopes straight to the DSN host. If the app origin and Rustrak origin differ, Rustrak must allow CORS (verify `PUBLIC_URL`/CORS env, or add a `tunnel` endpoint later). Not a code change here.
- **Client bundle cost** → The injected startup script is tiny (errors only, no tracing); it shrinks to a no-op guard when `PUBLIC_SENTRY_DSN` is unset.

## Migration Plan

Config-only for browser capture: set `PUBLIC_SENTRY_DSN` in prod env when ready. Server capture is additive (no env needed, reuses `SENTRY_DSN`). Rollback: flip `enabled.client` to `false` and remove `PUBLIC_SENTRY_DSN`; server side, revert the mapper branches.

## Open Questions

None.