/**
 * Barrel exports for user domain errors and error factories.
 *
 * @module domains/user/errors
 * @remarks
 * Surfaces typed domain, validation, and authorization errors raised during
 * user profile lookups together with factory helpers that construct them.
 * @see {@link module:domains/user/errors/user-not-found-error} for error class definitions
 * @example
 * ```typescript
 * import { userNotFound, UserUnauthorizedError } from '@domains/user/errors'
 *
 * throw userNotFound('user-123')
 * ```
 */
export * from './user-not-found-error'
