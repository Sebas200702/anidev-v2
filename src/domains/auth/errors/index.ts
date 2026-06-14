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
 * ```
 */

export { InvalidCredentialsError } from './invalid-credentials-error'
export { SessionExpiredError } from './session-expired-error'
export { RegistrationFailedError } from './registration-failed-error'
