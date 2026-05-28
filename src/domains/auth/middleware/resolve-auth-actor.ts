/**
 * Resolves the authenticated actor for Astro middleware and API routes.
 *
 * @module domains/auth/middleware/resolve-auth-actor
 * @remarks
 * Non-throwing session resolver intended for Astro middleware where unauthenticated
 * visitors are expected. Calls Better Auth `getSession` directly (not via
 * {@link sessionService}) and returns `null` user/session on any failure — including
 * expired sessions — so pages can render without a hard redirect.
 *
 * For API routes that must enforce authentication, prefer {@link sessionService.getSession}
 * which throws {@link SessionExpiredError} and other typed errors mappable via
 * {@link mapErrorToHttp}.
 *
 * @see {@link sessionService.getSession} — throwing session lookup for API enforcement
 * @see {@link credentialsService.login} — establishes the session this function reads
 */
import { auth } from '@lib/auth/server'

type SessionLocals = Pick<App.Locals, 'user' | 'session'>

/**
 * Loads the current user and session from Better Auth request cookies/headers.
 *
 * @param requestHeaders - Incoming request headers (typically `Astro.request.headers`
 *   or `Request.headers` in API routes)
 * @returns User and session locals compatible with `App.Locals`, or `null` values when
 *   unauthenticated or when session resolution fails for any reason
 *
 * @remarks
 * **Session flow**
 * 1. Forwards headers to `auth.api.getSession({ headers })`
 * 2. Extracts `user` and `session` from the Better Auth response
 * 3. On any error (network, expired token, malformed cookie), returns `{ user: null, session: null }`
 *    instead of throwing — safe for public pages with optional auth UI
 *
 * **Security note:** Swallowing errors prevents middleware crashes but means expired sessions
 * appear as logged-out rather than triggering a 401. Use {@link sessionService} in protected
 * API handlers when explicit auth failure responses are required.
 *
 * @see {@link sessionService.getSession} — strict session lookup with typed errors
 * @see {@link sessionResponseSchema} — expected Better Auth session response shape
 *
 * @example
 * ```typescript
 * // astro middleware
 * import { resolveAuthActor } from '@domains/auth/middleware/resolve-auth-actor'
 *
 * export const onRequest = defineMiddleware(async (context, next) => {
 *   const { user, session } = await resolveAuthActor(context.request.headers)
 *   context.locals.user = user
 *   context.locals.session = session
 *   return next()
 * })
 * ```
 *
 * @example
 * ```typescript
 * // optional auth in a page
 * const { user } = await resolveAuthActor(Astro.request.headers)
 * if (user) {
 *   // show authenticated nav
 * }
 * ```
 */
export async function resolveAuthActor(
  requestHeaders: Headers
): Promise<SessionLocals> {
  try {
    const sessionData = await auth.api.getSession({
      headers: requestHeaders,
    })

    return {
      user: sessionData?.user ?? null,
      session: sessionData?.session ?? null,
    }
  } catch {
    return {
      user: null,
      session: null,
    }
  }
}
