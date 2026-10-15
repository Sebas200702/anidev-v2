/**
 * Authentication or authorization failure.
 *
 * @module shared/errors/auth-error
 * @remarks
 * Mapped to **401** for missing/invalid/expired credentials, **403** for `AUTH_FORBIDDEN`.
 * Logged at `warn` and sent to Sentry at `warning` level.
 *
 * @see {@link BaseError} for the shared code/severity/details contract
 */
import type { ErrorCode } from '@shared/errors/codes'
import { BaseError } from '@shared/errors/base-error'

/**
 * Authentication or authorization failure.
 */
export class AuthError extends BaseError {
  /**
   * @param code - Stable application error code
   * @param message - Human-readable error message
   * @param details - Optional structured context for logs
   * @param cause - Optional underlying error
   */
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    cause?: unknown
  ) {
    super('AuthError', code, message, 'warn', details, cause)
  }
}
