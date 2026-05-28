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
 */
import { defineMiddleware } from 'astro:middleware'
import { isPublicRoute } from '@config/public-routes'
import { resolveAuthActor } from '@domains/auth/middleware'

/** Cookie substrings that indicate a Better Auth session may be present. */
const authCookieMarkers = ['session_token=', 'session_data=']

/**
 * Clears authenticated actor state on request locals.
 *
 * @param locals - Astro `App.Locals` for the current request; mutated in place.
 * @returns `void`. Side effect: sets `locals.user` and `locals.session` to `null`.
 *
 * @throws Does not throw.
 *
 * @see {@link onRequest} for call sites
 */
const clearSession = (locals: App.Locals) => {
  locals.user = null
  locals.session = null
}

/**
 * Detects whether the raw `Cookie` header contains Better Auth session markers.
 *
 * @param cookieHeader - Value of the `Cookie` request header, or `null` when absent.
 * Case-sensitive substring match against {@link authCookieMarkers}.
 * @returns `true` when any marker appears in the header; `false` for `null`,
 * empty string, or headers without session cookies.
 *
 * @throws Does not throw.
 *
 * @see {@link onRequest} for usage before auth resolution
 */
const hasAuthCookie = (cookieHeader: string | null) => {
  if (!cookieHeader) {
    return false
  }

  return authCookieMarkers.some((marker) => cookieHeader.includes(marker))
}

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

  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    clearSession(context.locals)
    return next()
  }

  if (!hasAuthCookie(context.request.headers.get('cookie'))) {
    clearSession(context.locals)
    return next()
  }

  const actor = await resolveAuthActor(context.request.headers)
  context.locals.user = actor.user
  context.locals.session = actor.session

  if (!actor.user && !isPublicRoute(pathname)) {
    clearSession(context.locals)
  }

  return next()
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
