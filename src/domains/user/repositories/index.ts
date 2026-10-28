/**
 * Barrel exports for user domain repositories.
 *
 * @module domains/user/repositories
 * @remarks
 * Re-exports data-access helpers that read and write user profile rows.
 * @see {@link module:domains/user/repositories/user-repository} for profile queries
 * @example
 * ```typescript
 * import { userRepository } from '@user/repositories'
 * ```
 */

export { userRepository } from './user'
export { userListRepository } from './user-list'
export { watchProgressRepository } from './watch-progress'
export { catalogIdsRepository } from './catalog-ids'
export { profileGalleryRepository } from './profile-gallery'
