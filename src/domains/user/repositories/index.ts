/**
 * Barrel exports for user domain repositories.
 *
 * @module domains/user/repositories
 * @remarks
 * Re-exports data-access helpers that read and write user profile rows.
 * @see {@link module:domains/user/repositories/user-repository} for profile queries
 * @example
 * ```typescript
 * import { userRepository } from '@domains/user/repositories'
 * ```
 */
export * from './user-repository'
