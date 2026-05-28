/**
 * Current session lookup API endpoint.
 *
 * @module pages/api/auth/session
 *
 * **Route:** `GET /api/auth/session`
 *
 * **Authentication:** Session optional — resolves the active session from cookies when
 * present. Not listed in {@link publicRoutes}; unauthenticated callers receive
 * `{ user: null, session: null }` rather than a 401.
 *
 * Returns the current Better Auth session and user object for client-side auth state.
 *
 * @see {@link sessionResponseSchema} — expected session payload shape
 * @see {@link sessionService.getSession} — Better Auth session lookup service
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping via {@link withErrorHandling}
 */

import type { APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { sessionService } from '@domains/auth/services'

/**
 * Returns the active session and user from request cookies or headers.
 *
 * @remarks
 * **Request**
 *
 * No params, query, or body. Forwards the incoming `Cookie` header to Better Auth.
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: {
 *     user: { id: string; email: string; name: string } | null
 *     session: { id: string; userId: string; expiresAt: Date } | null
 *   }
 *   status: 200
 *   meta: {}
 * }
 * ```
 *
 * When no session cookies are present or the user is unauthenticated, both `user` and
 * `session` are `null` with status `200`.
 *
 * **Error responses** (JSON envelope: `{ data: null, status, error, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 401 | `AUTH_SESSION_EXPIRED` | Session token is present but expired |
 * | 401 | `AUTH_INVALID_TOKEN` | Session token is malformed or invalid |
 * | 401 | `AUTH_REQUIRED` | Better Auth returns an unmapped authentication failure |
 * | 403 | `AUTH_FORBIDDEN` | Better Auth rejects the session lookup |
 * | 500 | `DB_ERROR` | Database error during session resolution |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/auth/session" -b cookies.txt
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/auth/session', { credentials: 'include' })
 * const { data } = await res.json()
 * // data.user: User | null, data.session: Session | null
 * ```
 */
export const GET: APIRoute = withErrorHandling(async ({ request }) => {
  const session = await sessionService.getSession(request.headers)

  return {
    data: session,
    status: 200,
    meta: {},
  }
})
