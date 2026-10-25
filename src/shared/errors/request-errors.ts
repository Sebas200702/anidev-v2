/**
 * Errors about the shape of the incoming request itself.
 *
 * @module shared/errors/request-errors
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/** The request body is larger than the route accepts (HTTP 413). */
export class RequestTooLargeError extends DomainError {
  constructor(maxBytes: number) {
    super(ErrorCodes.REQUEST_TOO_LARGE, 'Request too large', { maxBytes })
  }
}

/**
 * Builds the 413 error.
 *
 * @param maxBytes - Limit the body exceeded
 */
export const requestTooLarge = (maxBytes: number) =>
  new RequestTooLargeError(maxBytes)
