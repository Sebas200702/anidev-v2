/**
 * Domain error raised when a route or query parameter is not a valid user identifier.
 *
 * @module domains/user/errors/user-invalid-id-error
 * @remarks
 * Thrown at validation boundaries before authorization or persistence access. The raw,
 * unparsed value is preserved in metadata to aid debugging. Surfaces as HTTP **400**
 * via {@link mapErrorToHttp} because {@link UserInvalidIdError} extends
 * {@link ValidationError}.
 *
 * @see {@link mapErrorToHttp}
 */
import { ValidationError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Error thrown when a user identifier parameter is invalid or malformed.
 *
 * @remarks
 * - **Code:** `USER_INVALID_ID`
 * - **Details:** `{ rawId: unknown }`
 * - **HTTP:** 400 (`ValidationError` branch in {@link mapErrorToHttp})
 *
 * @example
 * ```typescript
 * throw userInvalidId(params.userId)
 * ```
 */
export class UserInvalidIdError extends ValidationError {
  constructor(rawId: unknown) {
    super(ErrorCodes.USER_INVALID_ID, 'Invalid user id', { rawId })
  }
}

/**
 * Factory for {@link UserInvalidIdError}.
 *
 * @param rawId - Unvalidated user identifier from the request (any shape)
 * @returns A {@link UserInvalidIdError} ready to be thrown
 * @see {@link UserInvalidIdError}
 * @example
 * ```typescript
 * throw userInvalidId(params.userId)
 * ```
 */
export const userInvalidId = (rawId: unknown) => {
  return new UserInvalidIdError(rawId)
}
