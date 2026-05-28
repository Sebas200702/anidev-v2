/**
 * Application service for user profile reads.
 *
 * @module domains/user/services/user-service
 * @remarks
 * Coordinates authorization ({@link userPolicies}), persistence
 * ({@link userRepository}), mapping ({@link mapUserProfile}), and
 * read-through caching ({@link userProfileCache}) for profile retrieval.
 *
 * **Cache flow for `getUserProfile`**
 *
 * 1. Build cache key via {@link userProfileCache.key} for `targetId`.
 * 2. Attempt read-through lookup with {@link withCache}:
 *    - **Hit:** Return cached {@link UserProfile} immediately (skips auth, DB, and mapper).
 *    - **Miss:** Run the `compute` pipeline below, then store via {@link userProfileCache.set}.
 * 3. **Authorize:** {@link userPolicies.canViewUserProfile} — currently always passes.
 * 4. **Load:** {@link userRepository.getUserProfileById} fetches the profile row.
 * 5. **Map:** {@link mapUserProfile} converts the DB row to API shape.
 * 6. **Store:** Persist mapped profile in cache with medium TTL.
 *
 * @see {@link userPolicies} for authorization rules
 * @see {@link userProfileCache} for cache key and TTL configuration
 * @see {@link withCache} for the read-through cache helper
 */
import { mapUserProfile } from '@domains/user/mappers/user-mapper'
import { userRepository } from '@domains/user/repositories/user-repository'
import { userPolicies } from '@domains/user/policies/user-policy'
import { withCache } from '@lib/cache'
import { userProfileCache } from '@domains/user/cache'
import { userNotFound, userUnauthorized } from '@domains/user/errors'

type GetUserProfileParams = {
  userId: string
  targetId: string
}

/**
 * Coordinates authorization, persistence, mapping, and caching for profiles.
 *
 * @remarks
 * Single entry point for loading user profiles in route handlers and other
 * domains. All side effects (cache, database) are encapsulated here.
 * @see {@link GetUserProfileParams}
 */
export const userService = {
  /**
   * Loads a user profile when the caller is allowed to view it.
   *
   * @param params - Actor (`userId`) and target (`targetId`) identifiers
   * @returns Cached or freshly loaded {@link UserProfile}
   * @throws {UserUnauthorizedError} When {@link userPolicies.canViewUserProfile} returns `false`
   * @throws {UserNotFoundError} When no profile row exists for `targetId`
   * @throws {DbError} When the underlying database query fails (from {@link userRepository.getUserProfileById})
   * @remarks
   * **Authorization:** Evaluates {@link userPolicies.canViewUserProfile} inside
   * the cache `compute` callback on cache miss. Profiles are currently public,
   * so this check always succeeds.
   *
   * **Caching:** Uses {@link withCache} with {@link userProfileCache}. Cache hits
   * bypass authorization and database access. On miss, the mapped profile is
   * written back with {@link CacheTtl.Medium}.
   *
   * **Mapping:** CSV-encoded DB columns (favorites, watched lists) are parsed
   * into number arrays by {@link mapUserProfile}.
   * @see {@link userProfileCache.key}
   * @see {@link mapUserProfile}
   * @example
   * ```typescript
   * const profile = await userService.getUserProfile({
   *   userId: session.userId,
   *   targetId: params.userId,
   * })
   *
   * console.log(profile.name, profile.preferences?.favoriteAnimes)
   * ```
   */
  async getUserProfile({ userId, targetId }: GetUserProfileParams) {
    return withCache({
      key: userProfileCache.key(targetId),
      getCache: () => userProfileCache.get(targetId),
      setCache: (_, userProfile) => userProfileCache.set(targetId, userProfile),

      compute: async () => {
        if (!userPolicies.canViewUserProfile({ userId, targetId })) {
          throw userUnauthorized(targetId)
        }

        const userProfileDB = await userRepository.getUserProfileById(targetId)

        if (!userProfileDB) {
          throw userNotFound(targetId)
        }

        return mapUserProfile({
          userProfile: userProfileDB,
        })
      },
    })
  },
}
