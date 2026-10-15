# Monitoring strategy (Sentry/Rustrak) — error-only

## Capture policy

- Server: every handled error class is captured via `mapErrorToHttp` →
  `captureError`: 4xx at `warning`, 5xx at `error`. Alerts fire on `error`
  only (see `docs/alerts.md`).
- Browser: `tracesSampleRate: 0`, no replay — errors and unhandled
  rejections only, when `PUBLIC_SENTRY_DSN` is set.

## `PUBLIC_SENTRY_DSN` is the on/off switch

- Set → browser error capture active.
- Unset → the injected init script no-ops (`if (dsn)` guard in
  `sentry.client.config.ts`); zero capture overhead, SDK bytes still ship
  (decision below).

## Gzip cost (2026-10-15, `client-budget.json`)

- Total client JS: **111,884 B gzip**.
- Sentry browser chunks (`client.*` + `page.*`): **≈104,840 B (~94%)**.
- App code (ClientRouter transitions + showcase controls + inlined
  controllers): the remaining ~7 KB.

## Decision: keep shipping the SDK chunk with unset DSN

Defer/lazy-init was evaluated: `@sentry/astro` injects its loader
unconditionally at build time, and gating it would mean custom script
injection outside the integration — complexity without payoff while the app
ships zero framework JS of its own. The `client-budget.mjs` CI check caps
total growth at +5%; if app JS ever approaches SDK size, revisit (lazy-init
or dropping the browser SDK and keeping server-only capture).

`sendDefaultPii: false` + `beforeSend` scrub (`scrubEvent`) apply on both
runtimes; Pino `pinoIntegration` bridges server logs.
