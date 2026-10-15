/**
 * Request validation failure from Zod or manual input checks.
 *
 * @module shared/errors/validation-error
 * @remarks
 * Mapped to **400**. Typical `details` shape: `{ issues: ZodIssue[] }` from {@link withZodValidation}.
 * Logged at `warn` and sent to Sentry at `warning` level.
 *
 * @see {@link BaseError} for the shared code/severity/details contract
 */
import type { ErrorCode } from '@shared/errors/codes'
import { BaseError } from '@shared/errors/base-error'

/**
 * Request validation failure from Zod or manual input checks.
 */
export class ValidationError extends BaseError {
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
    super('ValidationError', code, message, 'warn', details, cause)
  }
}
