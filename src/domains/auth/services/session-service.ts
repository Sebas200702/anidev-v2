/**
 * Session lifecycle operations via Better Auth.
 *
 * @module domains/auth/services/session-service
 * @remarks
 * Wraps Better Auth session endpoints for reading and terminating authenticated sessions.
 * Session state is cookie-backed; always pass the incoming request headers so Better Auth
 * can read and update session tokens securely.
 *
 * **Better Auth API calls**
 * - {@link sessionService.getSession} → `auth.api.getSession`
 * - {@link sessionService.logout} → `auth.api.signOut`
 *
 * @see {@link credentialsService} — establishes sessions after sign-in/sign-up
 * @see {@link resolveAuthActor} — middleware variant that swallows session errors
 * @see {@link sessionResponseSchema} — Zod shape for session lookup responses
 * @see {@link mapBetterAuthError} — error normalization layer
 */
import { auth } from '@lib/auth/server'
import { mapBetterAuthError } from '@domains/auth/utils/map-better-auth-error-util'

type AuthResult<T> = {
  data: T
  headers: Headers
}

/**
 * Better Auth wrapper for session lookup and sign-out.
 *
 * @remarks
 * Unlike {@link resolveAuthActor}, this service throws typed errors on session failures
 * so API routes can return appropriate HTTP status codes via {@link mapErrorToHttp}.
 *
 * @see {@link sessionService.getSession} — `getSession`
 * @see {@link sessionService.logout} — `signOut`
 *
 * @example
 * ```typescript
 * import { sessionService } from '@domains/auth/services/session-service'
 *
 * const session = await sessionService.getSession(request.headers)
 * if (!session) {
 *   // unauthenticated
 * }
 * ```
 */
export const sessionService = {
  /**
   * Resolves the current session from request cookies/headers via Better Auth `getSession`.
   *
   * @param requestHeaders - Incoming request headers containing session cookies
   * @returns Session and user objects from Better Auth, or `null` when unauthenticated
   *
   * @throws {SessionExpiredError} When Better Auth reports an expired session (mapped from
   *   messages containing `"session"` and `"expired"`)
   * @throws {AuthError} When Better Auth returns an unmapped failure via {@link mapBetterAuthError}
   *
   * @remarks
   * Calls `auth.api.getSession({ headers })`. A `null` return indicates no active session
   * without an error — distinct from {@link SessionExpiredError}, which signals an invalid
   * or expired token that should trigger re-authentication.
   *
   * @see {@link sessionResponseSchema} — expected response shape for validation
   * @see {@link resolveAuthActor} — non-throwing middleware alternative
   * @see {@link mapErrorToHttp} — HTTP 401 for {@link SessionExpiredError}
   *
   * @example
   * ```typescript
   * const sessionData = await sessionService.getSession(request.headers)
   * if (sessionData?.user) {
   *   console.log(sessionData.user.email)
   * }
   * ```
   */
  async getSession(requestHeaders: Headers) {
    try {
      const session = await auth.api.getSession({
        headers: requestHeaders,
      })

      return session
    } catch (error) {
      throw mapBetterAuthError(error)
    }
  },

  /**
   * Signs the user out and clears session cookies via Better Auth `signOut`.
   *
   * @param requestHeaders - Incoming request headers containing the session to terminate
   * @returns Sign-out payload from Better Auth plus response headers to forward (cleared cookies)
   *
   * @throws {AuthError} When Better Auth returns an unmapped failure via {@link mapBetterAuthError}
   *
   * @remarks
   * Calls `auth.api.signOut({ headers, returnHeaders: true })`. Forward returned headers
   * on the HTTP response so session cookies are cleared in the browser. Does not throw
   * {@link SessionExpiredError} for already-expired sessions unless Better Auth rejects
   * the sign-out attempt.
   *
   * @see {@link credentialsService.login} — counterpart that establishes a session
   * @see {@link mapBetterAuthError} — converts raw Better Auth errors to domain errors
   *
   * @example
   * ```typescript
   * const result = await sessionService.logout(request.headers)
   * return new Response(JSON.stringify(result.data), { headers: result.headers })
   * ```
   */
  async logout(requestHeaders: Headers): Promise<AuthResult<unknown>> {
    try {
      const result = await auth.api.signOut({
        headers: requestHeaders,
        returnHeaders: true,
      })

      return {
        data: result.response,
        headers: result.headers,
      }
    } catch (error) {
      throw mapBetterAuthError(error)
    }
  },
}
