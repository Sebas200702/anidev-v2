/**
 * @file Sentry (Rustrak) client bootstrap for the Astro integration.
 *
 * @remarks
 * Auto-discovered by `@sentry/astro` (`sentryAstro` integration looks for
 * `sentry.client.config.ts` at the project root) and injected as a browser
 * script on every delivered page (`injectScript('page', …)`). Leaves
 * `tracesSampleRate` at `0` so the bundle only captures errors — no browser
 * tracing, replay, or profiling.
 *
 * Reads the DSN from `PUBLIC_SENTRY_DSN` (Vite only exposes `PUBLIC_`-prefixed
 * variables to the browser bundle) and no-ops entirely when it is unset, so the
 * injected script adds no capture overhead in environments without browser
 * monitoring.
 *
 * This file must NOT import `@config/env` — that module runs eager Zod
 * validation for server variables and would crash inside the browser bundle.
 *
 * @see {@link module:lib/monitoring/sentry} for the server-side bootstrap
 */
import * as Sentry from '@sentry/astro'

const dsn = import.meta.env.PUBLIC_SENTRY_DSN as string | undefined

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0,
  })
}
