/**
 * Authentication domain error exports.
 *
 * @module domains/auth/errors
 * @remarks
 * Typed {@link AuthError} subclasses for credential, registration, and session failures.
 * Each error carries a stable {@link ErrorCode} that {@link mapErrorToHttp} maps to HTTP
 * status codes (401 for invalid credentials and expired sessions, 400 for registration
 * validation failures).
 *
 * @see {@link InvalidCredentialsError} — rejected email/password sign-in
 * @see {@link SessionExpiredError} — expired or invalid session token
 * @see {@link RegistrationFailedError} — duplicate account or sign-up validation failure
 * @see {@link mapErrorToHttp} — HTTP status mapping for auth error codes
 *
 * @example
 * ```typescript
 * import {
 *   InvalidCredentialsError,
 *   SessionExpiredError,
 *   RegistrationFailedError,
 * } from '@domains/auth/errors'
 *
 * try {
 *   await credentialsService.login(input, headers)
 * } catch (error) {
 *   if (error instanceof InvalidCredentialsError) {
 *     const { status } = mapErrorToHttp(error) // 401
 *   }
 * }
 * ```
 */

/** Error raised when email/password authentication fails. */
export * from './invalid-credentials-error'
/** Error raised when an authenticated session is no longer valid. */
export * from './session-expired-error'
/** Error raised when user registration cannot be completed. */
export * from './registration-failed-error'
