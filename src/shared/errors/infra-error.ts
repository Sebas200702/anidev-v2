/**
 * Infrastructure failure: database, cache, external APIs, or other operational errors.
 *
 * @module shared/errors/infra-error
 * @remarks
 * Always mapped to **503** with a generic client message (`Retry-After` header included). Logged at `error`
 * and sent to Sentry at `error` level. Severity is `critical` on the error instance.
 *
 * @see {@link BaseError} for the shared code/severity/details contract
 */
import type { ErrorCode } from '@shared/errors/codes'
import { BaseError } from '@shared/errors/base-error'

/**
 * Infrastructure failure: database, cache, external APIs, or other operational errors.
 */
export class InfraError extends BaseError {
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
    super('InfraError', code, message, 'critical', details, cause)
  }
}
