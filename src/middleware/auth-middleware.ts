/**
 * @module middleware/auth-middleware
 *
 * Astro middleware that resolves Better Auth session state on every incoming
 * request and populates `App.Locals` with `user` and `session` before route
 * handlers run. Enforces a soft gate: invalid sessions on protected routes
 * are cleared rather than returning 401 at the middleware layer.
 *
 * @remarks
 * Login and register API paths always clear locals to avoid stale session
 * bleed during credential exchange. When auth cookies are absent, locals are
 * nulled without calling the auth service. When cookies exist but resolution
 * fails on a protected route, locals are cleared so downstream handlers see
 * an anonymous actor.
 *
 * @see {@link module:config/public-routes} for routes that skip session enforcement
 * @see {@link module:types/env.d} for `App.Locals` typing
 * @see {@link module:lib/auth/server} for the Better Auth server instance
 * @see {@link module:lib/monitoring/sentry.initAstroSentry} for the monitoring bootstrap
 */
import { defineMiddleware } from 'astro:middleware'
import { isPublicRoute } from '@config/public-routes'
import { resolveAuthActor } from '@auth/middleware'
import {
  enforceRateLimit,
  getClientIp,
  resolveRateLimit,
} from '@middleware/rate-limit'
import { applySecurityHeaders } from '@middleware/security-headers'
import { clearSession, hasAuthCookie } from '@middleware/session-cookies'
import { initAstroSentry } from '@lib/monitoring/sentry'
import { logger } from '@utils/logger-util'

// Initialize monitoring at middleware load so the SDK is active before any
// request — page or API endpoint — is handled. `@sentry/astro` only injects
// `sentry.server.config` on page renders, so API-first traffic would otherwise
// never wire the pino bridge. No-op when SENTRY_DSN is unset.
initAstroSentry()

/**
 * Populates `locals.user` and `locals.session` from auth cookies when present.
 *
 * Runs on every Astro request. Skips auth resolution for login/register paths
 * and when no session cookies are sent. On protected routes, clears locals when
 * resolution yields no user.
 *
 * @param context - Astro middleware context for the current request, including
 * `url`, `request`, and `locals`.
 * @param next - Continues the middleware chain and route handling.
 * @returns The downstream middleware or route `Response` from `next()`.
 *
 * @throws May propagate errors from {@link resolveAuthActor} when the auth
 * service fails unexpectedly; network and database errors are not swallowed here.
 *
 * @example
 * ```typescript
 * // Registered automatically via src/middleware/index.ts
 * // In a page or API route:
 * export const GET = ({ locals }) => {
 *   if (!locals.user) return new Response('Unauthorized', { status: 401 })
 *   return new Response(`Hello ${locals.user.name}`)
 * }
 * ```
 *
 * @see {@link requestSessionMiddleware} legacy alias
 * @see {@link isPublicRoute} for protected vs public path classification
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url
  const requestId =
    context.request.headers.get('x-request-id') ?? crypto.randomUUID()
  context.locals.requestId = requestId
  const startedAt = Date.now()

  const finish = <T>(response: T): T => {
    const status = response instanceof Response ? response.status : 'unknown'
    logger.info(
      {
        requestId,
        method: context.request.method,
        route: pathname,
        status,
        durationMs: Date.now() - startedAt,
        actor: context.locals.user ? 'user' : 'anonymous',
      },
      'request'
    )
    return applySecurityHeaders(response, requestId)
  }

  const rateLimit = resolveRateLimit(
    pathname,
    getClientIp(context.request),
    context.request.method
  )
  if (rateLimit) {
    const result = await enforceRateLimit(rateLimit.keys, rateLimit.limit)
    if (!result.allowed) {
      return finish(
        new Response(
          JSON.stringify({
            data: null,
            status: 429,
            error: 'Too many requests',
            code: 'RATE_LIMITED',
            meta: {},
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(result.retryAfter || 1),
            },
          }
        )
      )
    }
  }

  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register')
  ) {
    clearSession(context.locals)
    return finish(await next())
  }

  if (!hasAuthCookie(context.request.headers.get('cookie'))) {
    clearSession(context.locals)
    return finish(await next())
  }

  const actor = await resolveAuthActor(context.request.headers)
  context.locals.user = actor.user
  context.locals.session = actor.session

  if (!actor.user && !isPublicRoute(pathname)) {
    clearSession(context.locals)
  }

  return finish(await next())
})

/**
 * Legacy alias for {@link onRequest}.
 *
 * @remarks
 * Retained for backward-compatible imports. New code should import
 * `onRequest` directly.
 *
 * @see {@link onRequest}
 */
export const requestSessionMiddleware = onRequest
