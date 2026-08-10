/**
 * Authorization error raised when a caller lacks permission to access a user resource.
 *
 * @module domains/user/errors/user-unauthorized-error
 * @remarks
 * Thrown by {@link userService.getUserProfile} and {@link userService.createUserProfile}
 * / {@link userService.updateUserProfile} when {@link userPolicies.canEditUserProfile}
 * returns `false`. Surfaces as HTTP **400** when thrown as a domain error, but write
 * routes use {@link requireAuthSession} for session presence (401) and the
 * cross-user path mismatch emits a dedicated forbidden response.
 *
 * @see {@link mapErrorToHttp}
 */
import { AuthError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Error thrown when policy denies access to a user resource.
 *
 * @remarks
 * - **Code:** `USER_UNAUTHORIZED`
 * - **Details:** `{ userId: string }`
 * - **HTTP:** 400 (DomainError) — callers preferring 401/403 should use
 *   {@link authRequired} / {@link authForbidden} from `@shared/errors/auth-errors`.
 *
 * @example
 * ```typescript
 * if (!userPolicies.canEditUserProfile({ userId, targetId })) {
 *   throw userUnauthorized(targetId)
 * }
 * ```
 */
export class UserUnauthorizedError extends AuthError {
  constructor(userId: string) {
    super(ErrorCodes.USER_UNAUTHORIZED, 'User not authorized', { userId })
  }
}

/**
 * Factory for {@link UserUnauthorizedError}.
 *
 * @param userId - User identifier that was denied access
 * @returns A {@link UserUnauthorizedError} ready to be thrown
 * @see {@link UserUnauthorizedError}
 * @example
 * ```typescript
 * throw userUnauthorized(targetId)
 * ```
 */
export const userUnauthorized = (userId: string) => {
  return new UserUnauthorizedError(userId)
}
