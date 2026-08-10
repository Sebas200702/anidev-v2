/**
 * Barrel exports for user domain mappers.
 *
 * @module domains/user/mappers
 * @remarks
 * Re-exports functions that transform between database rows and API-facing
 * DTOs — {@link mapUserProfile} for reads and the identity reverse mappers for
 * writes.
 * @see {@link module:domains/user/mappers/user} for DB → API read mapping
 * @see {@link module:domains/user/mappers/user-identity} for API → DB write mapping
 * @example
 * ```typescript
 * import { mapUserProfile } from '@user/mappers'
 * ```
 */

export { mapUserProfile } from './user'
export {
  type MapProfileIdentityToDbInput,
  mapProfileIdentityToDb,
  mapProfileIdentityPatchToDb,
} from './user-identity'
