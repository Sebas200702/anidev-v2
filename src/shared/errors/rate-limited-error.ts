/**
 * Rate limit exceeded.
 *
 * @module shared/errors/rate-limited-error
 * @remarks
 * Mapped to **429** with `Retry-After`. Logged at `warn`.
 *
 * @see {@link BaseError} for the shared code/severity/details contract
 */
import { ErrorCodes } from '@shared/errors/codes'
import { BaseError } from '@shared/errors/base-error'

/**
 * Rate limit exceeded.
 */
export class RateLimitedError extends BaseError {
  /**
   * @param retryAfterSeconds - Seconds clients should wait before retrying
   * @param details - Optional structured context for logs
   * @param cause - Optional underlying error
   */
  constructor(retryAfterSeconds = 60, details?: unknown, cause?: unknown) {
    super(
      'RateLimitedError',
      ErrorCodes.RATE_LIMITED,
      'Too many requests',
      'warn',
      details,
      cause
    )
    this.retryAfterSeconds = retryAfterSeconds
  }

  readonly retryAfterSeconds: number
}
