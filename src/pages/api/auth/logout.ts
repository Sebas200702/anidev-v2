/**
 * User logout API endpoint.
 *
 * @module pages/api/auth/logout
 *
 * **Route:** `POST /api/auth/logout`
 *
 * **Authentication:** Session recommended — sends session cookies to Better Auth so the
 * active session can be invalidated. Not listed in {@link publicRoutes}; middleware
 * resolves session state but does not block unauthenticated callers at the HTTP layer.
 *
 * Signs the current user out via Better Auth and returns updated headers that clear
 * session cookies.
 *
 * @see {@link sessionService.logout} — Better Auth sign-out service
 * @see {@link mapErrorToHttp} — error-to-HTTP mapping via {@link withErrorHandling}
 */

import type { APIRoute } from 'astro'
import { withErrorHandling } from '@http/with-error-handling'
import { sessionService } from '@domains/auth/services'

/**
 * Ends the current authenticated session and clears session cookies.
 *
 * @remarks
 * **Request**
 *
 * No body or query parameters. Forwards the incoming `Cookie` header to Better Auth.
 *
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: unknown // Better Auth sign-out payload
 *   status: 200
 *   meta: {}
 * }
 * ```
 *
 * Response includes updated `Set-Cookie` headers that invalidate the session.
 *
 * **Error responses** (JSON envelope: `{ data: null, status, error, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 401 | `AUTH_REQUIRED` | No valid session to sign out, or Better Auth auth failure |
 * | 401 | `AUTH_INVALID_TOKEN` | Session token is invalid |
 * | 401 | `AUTH_SESSION_EXPIRED` | Session has already expired |
 * | 403 | `AUTH_FORBIDDEN` | Better Auth rejects the sign-out request |
 * | 500 | `DB_ERROR` | Database error during sign-out |
 * | 500 | `UNKNOWN_ERROR` | Unhandled throwable |
 *
 * @example
 * ```bash
 * curl -X POST "http://localhost:4321/api/auth/logout" \
 *   -b cookies.txt
 * ```
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/auth/logout', {
 *   method: 'POST',
 *   credentials: 'include',
 * })
 * const { data, status } = await res.json()
 * // status: 200, session cookies cleared
 * ```
 */
export const POST: APIRoute = withErrorHandling(async ({ request }) => {
  const result = await sessionService.logout(request.headers)

  return {
    data: result.data,
    status: 200,
    meta: {},
    headers: result.headers,
  }
})
