/**
 * Domain error raised when no user profile exists for the given identifier.
 *
 * @module domains/user/errors/user-not-found-error
 * @remarks
 * Thrown by {@link userService.getUserProfile}, {@link userService.updateUserProfile}
 * (after `updateProfile` returns `undefined`) and any code that resolves a profile row
 * by id. Surfaces as HTTP **404** via {@link mapErrorToHttp} (`USER_NOT_FOUND` is in the
 * not-found set).
 *
 * Distinct from {@link UserInvalidIdError}, which covers malformed route or query
 * parameters and maps to 400.
 *
 * @see {@link mapErrorToHttp}
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Error thrown when no user profile exists for the given identifier.
 *
 * @remarks
 * - **Code:** `USER_NOT_FOUND`
 * - **Details:** `{ id: string }`
 * - **HTTP:** 404 (`DomainError` + `NOT_FOUND_DOMAIN_CODES` in {@link mapErrorToHttp})
 *
 * @example
 * ```typescript
 * if (!row) throw userNotFound(targetId)
 * ```
 */
export class UserNotFoundError extends DomainError {
  constructor(id: string) {
    super(ErrorCodes.USER_NOT_FOUND, 'User not found', { id })
  }
}

/**
 * Factory for {@link UserNotFoundError}.
 *
 * @param id - User identifier that was not found
 * @returns A {@link UserNotFoundError} ready to be thrown
 * @see {@link UserNotFoundError}
 * @example
 * ```typescript
 * throw userNotFound('user-123')
 * ```
 */
export const userNotFound = (id: string) => {
  return new UserNotFoundError(id)
}
