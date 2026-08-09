## 1. Server error capture (TDD)

- [x] 1.1 Write failing tests in `src/shared/errors/__tests__/map-error-to-http.test.ts`: `captureException` is called with `level: 'warning'` for `ValidationError`, `AuthError`, and `DomainError`; with `level: 'error'` for `InfraError` and unknown errors; responses unchanged and no capture without a DSN
- [x] 1.2 Add `src/shared/errors/capture-error.ts` helper (`captureError(error, level = 'error')`) wrapping `SentryNode.captureException`
- [x] 1.3 Wire captures into `mapErrorToHttp`: all handled classes reported, 4xx → `warning`, 5xx → `error`, drop the direct Sentry import, update the module JSDoc Sentry behavior table

## 2. Route error logging

- [x] 2.1 Fix `with-error-handling.ts` logger import: `better-auth` → `@utils/logger-util`

## 3. Browser SDK

- [x] 3.1 Enable client capture in `astro.config.mjs`: `enabled: { server: true, client: true }`, update integration comment
- [x] 3.2 Create `sentry.client.config.ts` at project root: init from `import.meta.env.PUBLIC_SENTRY_DSN` (no-op when unset), `environment` from `import.meta.env.MODE`, `tracesSampleRate: 0`
- [x] 3.3 Add optional `PUBLIC_SENTRY_DSN` to `.env.example` and `.env.local.example` with a comment that it mirrors `SENTRY_DSN` for browser coverage

## 4. Verification

- [x] 4.1 Run the quality gate: `bun run format` → `bun run check` → `bun run check:types` → `bun run test` → `bun run build`
- [x] 4.2 Build and run the output with a DSN configured; confirm SSR pages include the injected browser SDK script and API error responses still use the standard envelope