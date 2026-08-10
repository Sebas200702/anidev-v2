/**
 * Conflict error raised when a profile write collides with an existing row.
 *
 * @module domains/user/errors/user-profile-conflict-error
 * @remarks
 * Thrown by {@link userService.createUserProfile} when the actor already has a profile.
 * Surfaces as HTTP **409** via {@link mapErrorToHttp} (`USER_PROFILE_CONFLICT` is in
 * the conflict set).
 *
 * @see {@link mapErrorToHttp}
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Error thrown when a profile write collides with an existing row.
 *
 * @remarks
 * - **Code:** `USER_PROFILE_CONFLICT`
 * - **Details:** `{ id: string }`
 * - **HTTP:** 409 (`DomainError` + `CONFLICT_DOMAIN_CODES` in {@link mapErrorToHttp})
 *
 * @example
 * ```typescript
 * if (existing) throw userProfileConflict(userId)
 * ```
 */
export class UserProfileConflictError extends DomainError {
  constructor(id: string) {
    super(ErrorCodes.USER_PROFILE_CONFLICT, 'User profile already exists', {
      id,
    })
  }
}

/**
 * Factory for {@link UserProfileConflictError}.
 *
 * @param userId - User identifier for which a profile already exists
 * @returns A {@link UserProfileConflictError} ready to be thrown
 * @see {@link UserProfileConflictError}
 * @example
 * ```typescript
 * if (existing) throw userProfileConflict(userId)
 * ```
 */
export const userProfileConflict = (userId: string) => {
  return new UserProfileConflictError(userId)
}
