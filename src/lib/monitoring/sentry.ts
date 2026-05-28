/**
 * @module lib/monitoring/sentry
 *
 * Sentry initialization and React error-boundary wiring for server (Node),
 * Astro, and client React runtimes. Centralizes DSN, environment tagging, and
 * trace sampling so production observability stays consistent across surfaces.
 *
 * @remarks
 * Monitoring is disabled when `SENTRY_DSN` is absent — all exported functions
 * become no-ops or pass-through wrappers. `tracesSampleRate` is fixed at `0.1`
 * for cost control; adjust here for higher fidelity in staging.
 *
 * @see {@link module:config/env} for `SENTRY_DSN` and `NODE_ENV`
 * @see {@link initServerSentry} for Node bootstrap
 * @see {@link initAstroSentry} for Astro integration bootstrap
 * @see {@link wrapReactComponentWithSentry} for client island protection
 */
import * as SentryNode from '@sentry/node'
import * as SentryAstro from '@sentry/astro'
import * as SentryReact from '@sentry/react'
import { env } from '@config/env'

/** Whether Sentry is configured for the current process. */
const isEnabled = !!env.SENTRY_DSN

/**
 * Initializes Sentry for Node/server-side error and trace reporting.
 *
 * @returns `void`. Side effect: registers Sentry Node SDK when enabled.
 *
 * @throws Does not throw when DSN is missing. May throw if Sentry Node `init`
 * receives invalid configuration (unlikely with validated env).
 *
 * @remarks
 * Call once during server/bootstrap entry (API workers, scripts). No-op when
 * `SENTRY_DSN` is unset.
 *
 * @example
 * ```typescript
 * import { initServerSentry } from '@lib/monitoring/sentry'
 *
 * initServerSentry()
 * ```
 *
 * @see {@link initAstroSentry} for Astro-specific SDK
 */
export function initServerSentry() {
  if (!isEnabled) return

  SentryNode.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1,
  })
}

/**
 * Initializes Sentry for the Astro integration (SSR + middleware spans).
 *
 * @returns `void`. Side effect: registers Sentry Astro SDK when enabled.
 *
 * @throws Does not throw when DSN is missing.
 *
 * @remarks
 * Invoke from Astro integration hook or server entry aligned with `@sentry/astro`
 * docs. No-op when monitoring disabled.
 *
 * @example
 * ```typescript
 * import { initAstroSentry } from '@lib/monitoring/sentry'
 *
 * initAstroSentry()
 * ```
 *
 * @see {@link initServerSentry} for non-Astro Node contexts
 */
export function initAstroSentry() {
  if (!isEnabled) return

  SentryAstro.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1,
  })
}

/**
 * Wraps a React component with a Sentry error boundary when monitoring is enabled.
 *
 * @typeParam T - React component type (props preserved loosely via Sentry HOC).
 * @param Component - React component constructor or function to protect.
 * @returns The Sentry-wrapped component when enabled; the original `Component`
 * reference unchanged when `SENTRY_DSN` is unset (no boundary overhead in dev).
 *
 * @throws Does not throw during wrap. Render errors inside the boundary are
 * captured by Sentry when enabled; `fallback` is `null` (blank UI on crash).
 *
 * @example
 * ```typescript
 * import { wrapReactComponentWithSentry } from '@lib/monitoring/sentry'
 * import { AnimePlayer } from './AnimePlayer'
 *
 * export default wrapReactComponentWithSentry(AnimePlayer)
 * ```
 *
 * @see {@link initAstroSentry} for SSR error capture
 */
export function wrapReactComponentWithSentry<T>(Component: T): T {
  if (!isEnabled) return Component

  // @ts-expect-error Sentry HOC typing does not preserve generic component props.
  return SentryReact.withErrorBoundary(Component, {
    fallback: null,
  })
}
