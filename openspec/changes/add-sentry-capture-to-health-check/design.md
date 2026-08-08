## Context

See proposal.md - Why. The health endpoint already logs via Pino (`logger.info`) and the pino→Sentry bridge is configured (`enableLogs: true` + `pinoIntegration()`). In production the log reaches stdout but no envelope reaches Rustrak, leaving two hypotheses: broken log bridge vs SDK not initializing. Adding an explicit `Sentry.captureMessage` produces a deterministic, bridge-independent signal.

## Goals / Non-Goals

**Goals:**

- Emit an explicit Sentry event from the health endpoint on every request.
- Disambiguate production connectivity issues: bridge problem vs SDK-init problem.
- Keep the endpoint behavior (200 envelope) unchanged.

**Non-Goals:**

- No changes to the monitoring init, DSN, or pino bridge.
- No changes to the existing Pino log line.
- No log-level changes.

## Decisions

**Use `Sentry.captureMessage` via the `@sentry/astro` namespace.**
`@sentry/astro` (v10.43.0, server entry) re-exports `captureMessage` from `@sentry/node`, so `import * as Sentry from '@sentry/astro'` exposes it. It sends an `event`-type envelope (message) to the DSN — distinct from log envelopes — so Rustrak issues view shows it even if log capture is misconfigured.

Alternative considered: `Sentry.logger.info(...)` — rejected, it exercises the same log path as the bridge, defeating the disambiguation goal. `captureMessage` is the correct bridge-independent probe.

**Call it after the logger line, fire-and-forget.**
`captureMessage` is non-blocking and safe when the SDK is uninitialized (no-op). No await needed. If `SENTRY_DSN` is unset, `isEnabled` is false and init never runs, but `captureMessage` on an uninitialized SDK no-ops without throwing — preserving the health endpoint's contract.

**Guard in tests with the same `@sentry/astro` mock.**
The existing health test mocks `@config/env`; extend it to also mock `@sentry/astro`'s `captureMessage` and assert it is called once per request.

## Risks / Trade-offs

- A `captureMessage` per health call could spam Rustrak if health checks are frequent → the endpoint is explicitly a smoke test; acceptable volume. Add sampling later if needed (out of scope).
- `captureMessage` default level is `info`; if Rustrak groups messages as issues, each distinct call may create an issue → use a stable `message` string so it groups into one issue.
