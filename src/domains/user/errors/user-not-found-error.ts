/**
 * Factory helpers for user lookup and authorization domain errors.
 *
 * @module domains/user/errors/user-not-found-error
 * @remarks
 * Factories return error instances so callers can `throw` them from services or route handlers.
 * The error classes themselves live in {@link user-error-classes} and are re-exported here so
 * existing `@domains/user/errors/user-not-found-error` imports keep working.
 */
import {
  UserInvalidIdError,
  UserNotFoundError,
  UserUnauthorizedError,
} from '@domains/user/errors/user-error-classes'

export * from '@domains/user/errors/user-error-classes'

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
