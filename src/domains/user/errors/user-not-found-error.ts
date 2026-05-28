/**
 * Domain errors raised for user lookup and authorization failures.
 *
 * @module domains/user/errors/user-not-found-error
 * @remarks
 * These errors extend shared base classes ({@link DomainError},
 * {@link ValidationError}, {@link AuthError}) and carry stable
 * {@link ErrorCodes} values for consistent HTTP mapping. Factory helpers
 * return instances so callers can `throw` them from services or route handlers.
 */
import { AuthError, DomainError, ValidationError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Thrown when no user profile exists for the given identifier.
 *
 * @remarks
 * Indicates the target user ID was syntactically valid but did not match a
 * persisted profile row. Distinct from {@link UserInvalidIdError}, which
 * covers malformed route or query parameters.
 * @see {@link userNotFound} for the factory helper
 * @see {@link userService.getUserProfile} where this error is raised
 * @example
 * ```typescript
 * if (!userProfileDB) {
 *   throw userNotFound(targetId)
 * }
 * ```
 */
export class UserNotFoundError extends DomainError {
  /**
   * Creates a not-found error for a missing user profile.
   *
   * @param id - User identifier that was not found
   * @returns A configured {@link UserNotFoundError} instance
   * @remarks
   * The identifier is attached to error metadata for logging and client
   * diagnostics under the {@link ErrorCodes.USER_NOT_FOUND} code.
   * @see {@link ErrorCodes.USER_NOT_FOUND}
   * @example
   * ```typescript
   * throw new UserNotFoundError('550e8400-e29b-41d4-a716-446655440000')
   * ```
   */
  constructor(id: string) {
    super(ErrorCodes.USER_NOT_FOUND, 'User not found', { id })
  }
}

/**
 * Thrown when a route or query parameter is not a valid user identifier.
 *
 * @remarks
 * Used at validation boundaries before authorization or persistence access.
 * The raw, unparsed value is preserved in metadata to aid debugging.
 * @see {@link userInvalidId} for the factory helper
 * @example
 * ```typescript
 * const parsed = getUserProfileSchema.safeParse(request)
 * if (!parsed.success) {
 *   throw userInvalidId(request.params.userId)
 * }
 * ```
 */
export class UserInvalidIdError extends ValidationError {
  /**
   * Creates a validation error for an invalid user identifier.
   *
   * @param rawId - Unparsed identifier from the request
   * @returns A configured {@link UserInvalidIdError} instance
   * @remarks
   * Accepts `unknown` because invalid IDs may arrive as numbers, empty
   * strings, or other non-string shapes from route parameters.
   * @see {@link ErrorCodes.USER_INVALID_ID}
   * @example
   * ```typescript
   * throw new UserInvalidIdError(undefined)
   * ```
   */
  constructor(rawId: unknown) {
    super(ErrorCodes.USER_INVALID_ID, 'Invalid user id', { rawId })
  }
}

/**
 * Thrown when the caller lacks permission to access a user resource.
 *
 * @remarks
 * Raised after policy evaluation denies access—for example when a user
 * attempts to view private preferences or history belonging to another
 * account. Public profile reads currently pass policy checks.
 * @see {@link userUnauthorized} for the factory helper
 * @see {@link userPolicies} for authorization rules
 * @example
 * ```typescript
 * if (!userPolicies.canViewUserPreferences({ userId, targetId })) {
 *   throw userUnauthorized(targetId)
 * }
 * ```
 */
export class UserUnauthorizedError extends AuthError {
  /**
   * Creates an authorization error for a denied access attempt.
   *
   * @param userId - User identifier that was denied access
   * @returns A configured {@link UserUnauthorizedError} instance
   * @remarks
   * Stores the denied resource owner ID in metadata under
   * {@link ErrorCodes.USER_UNAUTHORIZED}.
   * @see {@link ErrorCodes.USER_UNAUTHORIZED}
   * @example
   * ```typescript
   * throw new UserUnauthorizedError('other-user-id')
   * ```
   */
  constructor(userId: string) {
    super(ErrorCodes.USER_UNAUTHORIZED, 'Unauthorized user', { userId })
  }
}

/**
 * Creates a {@link UserNotFoundError} for the given user identifier.
 *
 * @param id - User identifier that was not found
 * @returns A {@link UserNotFoundError} ready to be thrown
 * @throws Does not throw; returns an error instance for the caller to throw
 * @remarks
 * Prefer this factory over `new UserNotFoundError()` in services to keep
 * construction consistent and reduce import surface area.
 * @see {@link UserNotFoundError}
 * @example
 * ```typescript
 * throw userNotFound(targetId)
 * ```
 */
export function userNotFound(id: string) {
  return new UserNotFoundError(id)
}

/**
 * Creates a {@link UserInvalidIdError} for an invalid identifier.
 *
 * @param rawId - Unparsed identifier from the request
 * @returns A {@link UserInvalidIdError} ready to be thrown
 * @throws Does not throw; returns an error instance for the caller to throw
 * @remarks
 * Use at validation boundaries when Zod or manual parsing rejects a user ID.
 * @see {@link UserInvalidIdError}
 * @example
 * ```typescript
 * throw userInvalidId(params.userId)
 * ```
 */
export function userInvalidId(rawId: unknown) {
  return new UserInvalidIdError(rawId)
}

/**
 * Creates a {@link UserUnauthorizedError} for a denied access attempt.
 *
 * @param userId - User identifier that was denied access
 * @returns A {@link UserUnauthorizedError} ready to be thrown
 * @throws Does not throw; returns an error instance for the caller to throw
 * @remarks
 * Typically thrown after a {@link userPolicies} check returns `false`.
 * @see {@link UserUnauthorizedError}
 * @see {@link userPolicies}
 * @example
 * ```typescript
 * throw userUnauthorized(targetId)
 * ```
 */
export function userUnauthorized(userId: string) {
  return new UserUnauthorizedError(userId)
}
