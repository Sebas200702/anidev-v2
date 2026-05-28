/**
 * Error raised when email/password authentication fails.
 *
 * @module domains/auth/errors/invalid-credentials-error
 * @remarks
 * Thrown when Better Auth rejects a sign-in attempt (via {@link mapBetterAuthError}) or when
 * credential validation fails upstream. Uses {@link ErrorCodes.AUTH_INVALID_TOKEN} so clients
 * receive a generic message without revealing whether the email or password was wrong — a
 * standard security practice for credential handling.
 *
 * **HTTP mapping via {@link mapErrorToHttp}**
 * - Error code: `AUTH_INVALID_TOKEN`
 * - HTTP status: **401 Unauthorized**
 * - Logged at `warn` severity; not reported to Sentry
 *
 * @see {@link credentialsService.login} — primary caller via Better Auth `signInEmail`
 * @see {@link mapBetterAuthError} — maps Better Auth "invalid credential" messages
 * @see {@link mapErrorToHttp} — converts to 401 response body `{ code, message, meta }`
 */
import { AuthError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Thrown when supplied email/password credentials are rejected by Better Auth.
 *
 * @remarks
 * Carries {@link ErrorCodes.AUTH_INVALID_TOKEN} with the fixed client message
 * `"Invalid email or password"`. Optional `details` preserves the original Better Auth
 * error for server-side logging without exposing it to clients.
 *
 * @extends AuthError
 *
 * @see {@link ErrorCodes.AUTH_INVALID_TOKEN}
 * @see {@link mapErrorToHttp} — maps to HTTP 401
 *
 * @example
 * ```typescript
 * import { InvalidCredentialsError } from '@domains/auth/errors'
 * import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
 *
 * const error = new InvalidCredentialsError({ reason: 'bad password' })
 * const { status, body } = mapErrorToHttp(error)
 * // status === 401
 * // body.code === 'AUTH_INVALID_TOKEN'
 * ```
 */
export class InvalidCredentialsError extends AuthError {
  /**
   * Creates an invalid-credentials error for a failed sign-in attempt.
   *
   * @param details - Optional underlying Better Auth error or diagnostic context
   *   stored in `error.details` for logging; not exposed verbatim to API clients
   *
   * @remarks
   * Default message is `"Invalid email or password"` to avoid account enumeration.
   * Error code is {@link ErrorCodes.AUTH_INVALID_TOKEN}.
   *
   * @see {@link mapErrorToHttp} — HTTP 401 Unauthorized
   *
   * @example
   * ```typescript
   * throw new InvalidCredentialsError(originalBetterAuthError)
   * ```
   */
  constructor(details?: unknown) {
    super(ErrorCodes.AUTH_INVALID_TOKEN, 'Invalid email or password', details)
  }
}
