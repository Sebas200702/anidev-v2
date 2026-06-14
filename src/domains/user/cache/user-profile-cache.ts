/**
 * User profile read-through cache helpers.
 *
 * @module domains/user/cache/user-profile-cache
 * @remarks
 * Serializes {@link UserProfile} objects under keys prefixed with
 * {@link CacheKeyPrefix.UserProfile}. Used by {@link userService.getUserProfile}
 * via {@link withCache} to avoid repeated database reads for hot profiles.
 * @see {@link userProfileCache.key} for key format
 * @see {@link CacheTtl.Medium} for entry TTL
 * @example
 * ```typescript
 * import { userProfileCache } from '@domains/user/cache'
 *
 * const cached = await userProfileCache.get('user-123')
 * if (!cached) {
 *   await userProfileCache.set('user-123', profile)
 * }
 * ```
 */
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'
import type { UserProfile } from '@domains/user/types/user-types'

/**
 * Cache helpers for serialized user profile payloads.
 *
 * @remarks
 * Stateless singleton object; safe to import across services and routes.
 * Values are full mapped {@link UserProfile} objects, not raw DB rows.
 * @see {@link userService.getUserProfile} for read-through integration
 */
export const userProfileCache = {
  /**
   * Builds the cache key for a user profile.
   *
   * @param userId - Target user identifier
   * @returns Cache key string in the form `UserProfile:{userId}`
   * @throws Does not throw; returns a deterministic key string
   * @remarks
   * Uses {@link CacheKeyPrefix.UserProfile} to namespace keys and avoid
   * collisions with other domain caches.
   * @see {@link userProfileCache.get}
   * @see {@link userProfileCache.set}
   * @example
   * ```typescript
   * userProfileCache.key('550e8400-e29b-41d4-a716-446655440000')
   * // => 'UserProfile:550e8400-e29b-41d4-a716-446655440000'
   * ```
   */
  key(userId: string) {
    return `${CacheKeyPrefix.UserProfile}:${userId}`
  },

  /**
   * Retrieves a cached user profile.
   *
   * @param userId - Target user identifier
   * @returns Cached {@link UserProfile}, or `null` when missing or expired
   * @throws May propagate underlying cache client errors from {@link cacheGet}
   * @remarks
   * Called by {@link withCache} before falling through to the compute path.
   * A hit skips authorization, database access, and mapping.
   * @see {@link userProfileCache.key}
   * @see {@link userService.getUserProfile}
   * @example
   * ```typescript
   * const profile = await userProfileCache.get('user-123')
   * if (profile) return profile
   * ```
   */
  async get(userId: string) {
    return cacheGet<UserProfile>(this.key(userId))
  },

  /**
   * Stores a user profile in the cache.
   *
   * @param userId - Target user identifier
   * @param value - Mapped profile payload to cache
   * @returns Result of the underlying {@link cacheSet} operation
   * @throws May propagate underlying cache client errors from {@link cacheSet}
   * @remarks
   * Applies {@link CacheTtl.Medium} seconds TTL. Invoked after a successful
   * compute in {@link userService.getUserProfile}.
   * @see {@link userProfileCache.key}
   * @see {@link CacheTtl.Medium}
   * @example
   * ```typescript
   * await userProfileCache.set('user-123', mappedProfile)
   * ```
   */
  async set(userId: string, value: UserProfile) {
    return cacheSet<UserProfile>(this.key(userId), value, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
