/**
 * Server-side contract violation: a route handler output failed its declared
 * response schema.
 *
 * @module shared/errors/response-validation-error
 * @remarks
 * Mapped to **500** with a generic client message. Thrown by
 * {@link withErrorHandling} when `options.responseSchema` rejects the payload.
 *
 * @see {@link BaseError} for the shared code/severity/details contract
 */
import { ErrorCodes } from '@shared/errors/codes'
import { BaseError } from '@shared/errors/base-error'

/**
 * Server-side contract violation: a route handler output failed its declared
 * response schema.
 */
export class ResponseValidationError extends BaseError {
  /**
   * @param details - Structured schema issues for logs
   * @param cause - Optional underlying error
   */
  constructor(details?: unknown, cause?: unknown) {
    super(
      'ResponseValidationError',
      ErrorCodes.RESPONSE_VALIDATION_ERROR,
      'Response validation failed',
      'error',
      details,
      cause
    )
  }
}
