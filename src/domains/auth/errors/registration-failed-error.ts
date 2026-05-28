/**
 * Error raised when user registration cannot be completed.
 *
 * @module domains/auth/errors/registration-failed-error
 * @remarks
 * Thrown when Better Auth `signUpEmail` fails due to duplicate accounts, validation
 * constraints, or other sign-up rejection. Uses {@link ErrorCodes.VALIDATION_ERROR} to
 * signal client-correctable input problems rather than an authentication/session failure.
 *
 * **HTTP mapping via {@link mapErrorToHttp}**
 * - Error code: `VALIDATION_ERROR`
 * - Intended semantic: **400 Bad Request** (validation / duplicate account)
 * - Extends {@link AuthError}; unrecognized auth codes fall through the auth mapper — callers
 *   should handle this error explicitly or ensure API wrappers map it appropriately
 *
 * @see {@link credentialsService.register} — primary caller via Better Auth `signUpEmail`
 * @see {@link mapBetterAuthError} — maps "already exists" and "duplicate" message patterns
 * @see {@link mapErrorToHttp} — HTTP status mapping for error codes
 */
import { AuthError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Thrown when sign-up fails due to validation or duplicate account issues.
 *
 * @remarks
 * Typically produced by {@link mapBetterAuthError} when Better Auth reports an existing
 * account (`"already exists"`, `"duplicate"` in the message). Carries
 * {@link ErrorCodes.VALIDATION_ERROR} so API layers can return a 400-class response with
 * a human-readable `message` describing the failure reason.
 *
 * @extends AuthError
 *
 * @see {@link ErrorCodes.VALIDATION_ERROR}
 * @see {@link RegisterInput} — validated registration payload shape
 *
 * @example
 * ```typescript
 * import { RegistrationFailedError } from '@domains/auth/errors'
 *
 * throw new RegistrationFailedError('An account with this email already exists', cause)
 * ```
 */
export class RegistrationFailedError extends AuthError {
  /**
   * Creates a registration-failure error for a rejected sign-up attempt.
   *
   * @param message - Human-readable failure reason forwarded to API clients;
   *   defaults to `"Registration failed"`
   * @param details - Optional underlying Better Auth error or diagnostic context
   *   stored in `error.details` for server-side logging
   *
   * @remarks
   * Error code is {@link ErrorCodes.VALIDATION_ERROR}. Common causes include duplicate
   * email addresses and Better Auth field validation rejections.
   *
   * @see {@link credentialsService.register} — Better Auth `signUpEmail` wrapper
   * @see {@link mapBetterAuthError} — automatic mapping from Better Auth messages
   *
   * @example
   * ```typescript
   * throw new RegistrationFailedError('Email already registered', originalError)
   * ```
   */
  constructor(message = 'Registration failed', details?: unknown) {
    super(ErrorCodes.VALIDATION_ERROR, message, details)
  }
}
