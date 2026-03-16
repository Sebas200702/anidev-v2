import * as SentryNode from '@sentry/node'
import * as SentryAstro from '@sentry/astro'
import * as SentryReact from '@sentry/react'
import { env } from '@/config/env'

const isEnabled = !!env.SENTRY_DSN

export function initServerSentry() {
  if (!isEnabled) return

  SentryNode.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1,
  })
}

export function initAstroSentry() {
  if (!isEnabled) return

  SentryAstro.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1,
  })
}

export function wrapReactComponentWithSentry<T>(Component: T): T {
  if (!isEnabled) return Component

  // @ts-expect-error 
  return SentryReact.withErrorBoundary(Component, {
    fallback: null,
  })
}
