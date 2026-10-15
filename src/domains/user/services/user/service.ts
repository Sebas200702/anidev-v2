/**
 * Application service for user profile reads and writes.
 *
 * @module domains/user/services/user/service
 * @remarks
 * Coordinates authorization ({@link userPolicies}), persistence
 * ({@link userRepository}), mapping ({@link mapUserProfile}), and
 * read-through caching ({@link userProfileCache}) for profile retrieval
 * plus owner-only create/update on the write path.
 *
 * **Read flow** (see {@link userService.getUserProfile})
 * 1. Cache lookup via {@link withCache} for `targetId`.
 * 2. On miss: authorize (`canViewUserProfile`), load, map, store.
 *
 * **Write flow** (create/update)
 * 1. Authorize ownership via `canEditUserProfile` against the session actor.
 * 2. Detect conflict (create) or not-found (update) using the repository.
 * 3. Persist via the repository with reverse-mapped identity columns.
 * 4. Invalidate the cached profile so subsequent reads are fresh.
 * 5. Map the returned row to the public {@link UserProfile} shape.
 *
 * @see {@link userPolicies}
 * @see {@link userRepository}
 * @see {@link userProfileCache}
 */
import { mapUserProfile } from '@user/mappers/user'
import { userPolicies } from '@user/policies/user'
import { userProfileSchema } from '@user/schemas/user-schema'
import {
  mapProfileIdentityPatchToDb,
  mapProfileIdentityToDb,
} from '@user/mappers/user-identity'
import { userRepository } from '@user/repositories/user'
import { withCache } from '@lib/cache'
import { userProfileCache } from '@user/cache'
import {
  userNotFound,
  userProfileConflict,
  userUnauthorized,
} from '@user/errors'
import type {
  CreateUserProfileParams,
  GetUserProfileParams,
  UpdateUserProfileParams,
} from './types'

/**
 * Coordinates authorization, persistence, mapping, and caching for profiles.
 *
 * @see {@link GetUserProfileParams}
 * @see {@link CreateUserProfileParams}
 * @see {@link UpdateUserProfileParams}
 */
export const userService = {
  /**
   * Loads a user profile when the caller is allowed to view it.
   *
   * @see {@link userProfileCache.key}
   * @see {@link mapUserProfile}
   * @example
   * ```typescript
   * const profile = await userService.getUserProfile({
   *   userId: session.userId,
   *   targetId: params.userId,
   * })
   * ```
   */
  async getUserProfile({ userId, targetId }: GetUserProfileParams) {
    // The cache stores the *full* (owner-level) mapped payload so a single
    // cached entry can serve every caller; private sections are projected
    // out at read time based on the caller (see below). Never store a
    // variant per actor blindly — that would multiply cache keys and leak.
    const cachedProfile = await withCache({
      key: userProfileCache.key(targetId),
      getCache: async () => {
        const cached = await userProfileCache.get(targetId)
        // Never serve a cached payload that fails the public contract:
        // a previously cached invalid result (e.g. stale shape) must not
        // survive the next read once the DB row is fixed.
        if (cached == null) return null
        return userProfileSchema.safeParse(cached).success ? cached : null
      },
      setCache: (_, userProfile) => userProfileCache.set(targetId, userProfile),
      shouldCache: (userProfile) =>
        userProfileSchema.safeParse(userProfile).success,
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

    // Owner-only projection applied *after* the cache read so anonymous and
    // non-owner callers never see another user's private sections even on a
    // cache-warm request (owner read first).
    const projection = { ...cachedProfile }
    if (!userPolicies.canViewUserPreferences({ userId, targetId })) {
      delete projection.preferences
    }
    if (!userPolicies.canViewUserHistory({ userId, targetId })) {
      delete projection.history
    }
    return projection
  },

  /**
   * Creates a profile for the authenticated actor and invalidates cache.
   *
   * @param params - Session user id and validated create input
   * @returns Mapped {@link UserProfile} for the new row
   * @throws {UserUnauthorizedError} When the actor cannot edit the target
   * @throws {UserProfileConflictError} When a profile already exists for the actor
   * @throws {DbError} When the database insert fails
   * @see {@link mapProfileIdentityToDb}
   * @see {@link userProfileCache.invalidate}
   */
  async createUserProfile({ userId, input }: CreateUserProfileParams) {
    if (!userPolicies.canEditUserProfile({ userId, targetId: userId })) {
      throw userUnauthorized(userId)
    }

    const row = mapProfileIdentityToDb({ id: userId, input })
    const inserted = await userRepository.createProfile(row)
    if (!inserted) {
      throw userProfileConflict(userId)
    }

    await userProfileCache.invalidate(userId)

    return mapUserProfile({ userProfile: inserted })
  },

  /**
   * Applies a partial identity update for the authenticated actor and busts cache.
   *
   * @param params - Session user id, target id, validated patch input
   * @returns Mapped {@link UserProfile} for the updated row
   * @throws {UserUnauthorizedError} When the actor cannot edit the target
   * @throws {UserNotFoundError} When no profile row matches the target
   * @throws {DbError} When the database update fails
   * @see {@link mapProfileIdentityPatchToDb}
   * @see {@link userProfileCache.invalidate}
   */
  async updateUserProfile({
    userId,
    targetId,
    input,
  }: UpdateUserProfileParams) {
    if (!userPolicies.canEditUserProfile({ userId, targetId })) {
      throw userUnauthorized(targetId)
    }

    const patch = mapProfileIdentityPatchToDb(input)
    const updated = await userRepository.updateProfile(targetId, patch)
    if (!updated) {
      throw userNotFound(targetId)
    }

    await userProfileCache.invalidate(targetId)
    return mapUserProfile({ userProfile: updated })
  },
}
