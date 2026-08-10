/**
 * Barrel exports for user domain errors and error factories.
 *
 * @module domains/user/errors
 * @remarks
 * Surfaces typed domain, validation, and authorization errors raised during
 * user profile lookups together with factory helpers that construct them.
 * Each error class and its factory live in the same file (one error per file),
 * mirroring the convention used in the anime and music domains.
 *
 * @see {@link module:domains/user/errors/user-not-found-error} — 404 not found
 * @see {@link module:domains/user/errors/user-invalid-id-error} — 400 bad id
 * @see {@link module:domains/user/errors/user-unauthorized-error} — 400 unauthorized
 * @see {@link module:domains/user/errors/user-profile-conflict-error} — 409 conflict
 * @example
 * ```typescript
 * import { userNotFound, UserProfileConflictError } from '@user/errors'
 *
 * throw userNotFound('user-123')
 * ```
 */

export {
  UserNotFoundError,
  userNotFound,
} from './user-not-found-error'
export {
  UserInvalidIdError,
  userInvalidId,
} from './user-invalid-id-error'
export {
  UserUnauthorizedError,
  userUnauthorized,
} from './user-unauthorized-error'
export {
  UserProfileConflictError,
  userProfileConflict,
} from './user-profile-conflict-error'
