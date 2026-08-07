/**
 * @file Sentry (Rustrak) server bootstrap for the Astro integration.
 *
 * @remarks
 * Auto-discovered by `@sentry/astro` (`sentryAstro` integration looks for
 * `sentry.server.config.(ts|js)` at the project root) and injected as a
 * side-effect import at SSR startup. It delegates to
 * {@link module:lib/monitoring/sentry.initAstroSentry}, which initializes the
 * SDK with the configured DSN, environment, `enableLogs`, and the pino bridge,
 * and no-ops entirely when `SENTRY_DSN` is unset.
 *
 * Keep the side-effect call at module top level — the integration imports this
 * file rather than invoking a named export.
 *
 * @see {@link module:lib/monitoring/sentry}
 */
import { initAstroSentry } from '@lib/monitoring/sentry'

initAstroSentry()
