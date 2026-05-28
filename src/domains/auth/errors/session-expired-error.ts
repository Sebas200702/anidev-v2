/**
 * Error raised when an authenticated session is no longer valid.
 *
 * @module domains/auth/errors/session-expired-error
 * @remarks
 * Thrown when Better Auth reports that the session token or cookie has expired during
 * {@link sessionService.getSession} or related session resolution. Clients should treat
 * this as a signal to re-authenticate rather than retry the same request unchanged.
 *
 * **HTTP mapping via {@link mapErrorToHttp}**
 * - Error code: `AUTH_SESSION_EXPIRED`
 * - HTTP status: **401 Unauthorized**
 * - Logged at `warn` severity; not reported to Sentry
 *
 * @see {@link sessionService.getSession} — Better Auth `getSession` wrapper
 * @see {@link mapBetterAuthError} — maps Better Auth "session expired" messages
 * @see {@link mapErrorToHttp} — converts to 401 response body `{ code, message, meta }`
 */
import { AuthError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Thrown when the current session has expired or is no longer accepted by Better Auth.
 *
 * @remarks
 * Carries {@link ErrorCodes.AUTH_SESSION_EXPIRED} with the fixed client message
 * `"Session has expired"`. Part of the session flow: after this error, the client
 * should clear local session state and redirect to login.
 *
 * @extends AuthError
 *
 * @see {@link ErrorCodes.AUTH_SESSION_EXPIRED}
 * @see {@link mapErrorToHttp} — maps to HTTP 401
 *
 * @example
 * ```typescript
 * import { SessionExpiredError } from '@domains/auth/errors'
 * import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
 *
 * const error = new SessionExpiredError()
 * const { status, body } = mapErrorToHttp(error)
 * // status === 401
 * // body.code === 'AUTH_SESSION_EXPIRED'
 * ```
 */
export class SessionExpiredError extends AuthError {
  /**
   * Creates a session-expired error for an invalid or timed-out session.
   *
   * @param details - Optional underlying Better Auth error or session metadata
   *   stored in `error.details` for logging; not exposed verbatim to API clients
   *
   * @remarks
   * Default message is `"Session has expired"`. Error code is
   * {@link ErrorCodes.AUTH_SESSION_EXPIRED}.
   *
   * @see {@link sessionService.getSession} — session lookup that may throw this error
   * @see {@link mapErrorToHttp} — HTTP 401 Unauthorized
   *
   * @example
   * ```typescript
   * throw new SessionExpiredError(originalBetterAuthError)
   * ```
   */
  constructor(details?: unknown) {
    super(ErrorCodes.AUTH_SESSION_EXPIRED, 'Session has expired', details)
  }
}
