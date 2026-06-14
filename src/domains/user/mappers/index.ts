/**
 * Barrel exports for user domain mappers.
 *
 * @module domains/user/mappers
 * @remarks
 * Re-exports functions that transform database rows into API-facing DTOs.
 * @see {@link module:domains/user/mappers/user-mapper} for profile mapping
 * @example
 * ```typescript
 * import { mapUserProfile } from '@domains/user/mappers'
 * ```
 */

export { mapUserProfile } from './user-mapper'
