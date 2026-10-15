/**
 * Business-rule violation raised by domain logic (not found, invalid id, unsupported path, etc.).
 *
 * @module shared/errors/domain-error
 * @remarks
 * Mapped to **404** when `code` is a known not-found code; otherwise **400**. Logged at `warn` or `error`
 * depending on status. Reported to Sentry at `warning` level.
 *
 * @see {@link BaseError} for the shared code/severity/details contract
 */
import type { ErrorCode } from '@shared/errors/codes'
import { BaseError } from '@shared/errors/base-error'

/**
 * Business-rule violation raised by domain logic (not found, invalid id, unsupported path, etc.
 */
export class DomainError extends BaseError {
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
    super('DomainError', code, message, 'error', details, cause)
  }
}
