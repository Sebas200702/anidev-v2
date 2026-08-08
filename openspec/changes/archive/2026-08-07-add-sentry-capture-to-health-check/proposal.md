## Why

In production the `GET /api/health` endpoint responds `200` and writes the Pino log line to stdout, but no envelope reaches Rustrak. The Pino→Sentry log bridge depends on `enableLogs: true` + `pinoIntegration()` (both configured), so if the SDK initializes, logs should flow. There is no way to tell from the app side whether the problem is (a) the log bridge, or (b) the SDK never initializing in the deployed container. An explicit `Sentry.captureMessage(...)` on the health endpoint disambiguates: if it appears in Rustrak → SDK + transport work and the issue is the pino bridge; if it does not → the SDK is not initializing (stale image or missing/unreachable DSN).

## What Changes

- Add an explicit `Sentry.captureMessage('Health check', { ... })` call in `GET /api/health`, alongside the existing `logger.info(...)`.
- Keep the pino log (unchanged) — the capture is additive.
- No changes to the monitoring init, DSN, or pino bridge.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `infrastructure/monitoring`: Add requirement that the health endpoint emits an explicit Sentry event on each request to verify end-to-end connectivity independent of the pino bridge.

## Impact

- `src/pages/api/health.ts` — add the `captureMessage` call + JSDoc.
- `src/pages/api/__tests__/health.test.ts` — assert `captureMessage` is invoked on request.
- No DSN, SDK version, or init changes.
