/**
 * Barrel exports for user domain cache helpers.
 *
 * @module domains/user/cache
 * @remarks
 * Re-exports the user profile read-through cache singleton.
 * @see {@link module:domains/user/cache/user-profile-cache} for implementation details
 * @example
 * ```typescript
 * import { userProfileCache } from '@domains/user/cache'
 *
 * const cached = await userProfileCache.get('user-123')
 * ```
 */
export { userProfileCache } from './user-profile-cache'
