## Why

Error coverage in Rustrak (the self-hosted Sentry-compatible backend) is partial. On the server, only `InfraError` (503) and unknown errors (500) reach Sentry via `mapErrorToHttp`; `ValidationError` (400), `AuthError` (401/403), and `DomainError` (400/404) are logged but never captured, so business-rule and client-input failures are invisible in Rustrak. On the browser the SDK is fully disabled (`enabled: { server: true, client: false }`), so `window.onerror` / `unhandledrejection` and future React island errors are never reported.

## What Changes

- **Server error capture completeness** — `mapErrorToHttp` starts capturing every handled error class: `ValidationError`, `AuthError`, and `DomainError` are reported to Sentry alongside the existing `InfraError` and unknown-error captures. 4xx captures are sent with `level: 'warning'` so they are filterable/excludable from alerts; 5xx stay at `error` level.
- **Browser error capture** — the Astro Sentry integration enables the client SDK (`enabled.client: true`) and a new root `sentry.client.config.ts` initializes the browser SDK on every page, capturing global errors and unhandled rejections. Client init no-ops when the DSN is unset.
- **Public DSN env var** — a new optional `PUBLIC_SENTRY_DSN` environment variable (Vite client-exposed) feeds the browser bundle; documented in `.env.example` and `.env.local.example`.
- **Route error logging fix** — `with-error-handling.ts` imports `logger` from `'better-auth'` instead of the application logger; these route errors never reach the pino→Sentry bridge. Import moved to `@utils/logger-util`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `infrastructure/monitoring`: server-side error capture now covers all handled error classes (4xx as `warning`, 5xx as `error`), and the browser SDK captures errors client-side when a DSN is configured.

## Impact

- `src/shared/errors/map-error-to-http.ts` — captures for `ValidationError`, `AuthError`, `DomainError`.
- `src/shared/errors/error-http-maps.ts` — docs stay accurate; capture lives in the top-level mapper.
- `src/shared/http/with-error-handling.ts` — logger import swap to `@utils/logger-util`.
- `astro.config.mjs` — `enabled: { server: true, client: true }`.
- `sentry.client.config.ts` (new, project root) — browser SDK init for `@sentry/astro`.
- `.env.example`, `.env.local.example` — `PUBLIC_SENTRY_DSN` optional var.
- Tests: `src/shared/errors/__tests__/map-error-to-http.test.ts` (new captures); monitoring init tests remain green.
- No dependency changes; `@sentry/astro` already installed (10.43.0).