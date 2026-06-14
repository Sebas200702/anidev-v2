/**
 * @module lib/monitoring
 *
 * Error and performance monitoring integrations centered on Sentry. Re-exports
 * initialization helpers for Node/server, Astro, and React runtimes so each
 * entry point can enable observability consistently when `SENTRY_DSN` is set.
 *
 * @remarks
 * All functions no-op when `SENTRY_DSN` is unset — safe to call unconditionally
 * in dev. Import from this barrel in app bootstrap code; import `./sentry`
 * directly when only one init function is needed.
 *
 * **Re-exports:**
 * - `./sentry` — `initServerSentry`, `initAstroSentry`, `wrapReactComponentWithSentry`
 *
 * @see {@link module:config/env} for optional `SENTRY_DSN`
 * @see {@link module:lib/monitoring/sentry} for implementation
 */

export { initServerSentry, initAstroSentry, wrapReactComponentWithSentry } from './sentry'
