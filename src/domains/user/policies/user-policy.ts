/**
 * Authorization policies for user-owned resources.
 *
 * @module domains/user/policies/user-policy
 * @remarks
 * Pure, synchronous policy functions evaluate whether an authenticated actor
 * (`userId`) may access a resource owned by `targetId`. Policies are invoked
 * by services before reads or writes; they never perform I/O.
 *
 * **Permission model summary**
 *
 * | Resource     | View                         | Edit              |
 * | ------------ | ---------------------------- | ----------------- |
 * | Profile      | Anyone (public)              | Owner only        |
 * | Preferences  | Owner only                   | Owner only        |
 * | Watch history| Owner only                   | Owner only        |
 *
 * @see {@link PolicyParameters} for the input shape shared by all checks
 * @see {@link userService} for policy usage during profile reads
 * @example
 * ```typescript
 * import { userPolicies } from '@domains/user/policies/user-policy'
 *
 * const canEdit = userPolicies.canEditUserProfile({
 *   userId: session.userId,
 *   targetId: params.userId,
 * })
 * ```
 */
import type { PolicyParameters } from '@domains/user/types/user-policies-types'

/**
 * Policy checks for profile, preferences, and watch-history access.
 *
 * @remarks
 * Each `can*` method is a pure predicate. Denied access should surface as
 * {@link UserUnauthorizedError} from the calling service or route handler.
 * @see {@link PolicyParameters}
 */
export const userPolicies = {
  /**
   * Whether the caller may view a user profile.
   *
   * @param _ - Actor and target identifiers (currently unused)
   * @returns Always `true`; profiles are publicly readable
   * @throws Does not throw; returns a boolean authorization result
   * @remarks
   * **Rule:** Any authenticated or anonymous caller may view any user
   * profile. No ownership check is performed. This applies to the public
   * profile fields exposed by {@link mapUserProfile} (identity, avatar,
   * preferences, and history as returned by the API).
   *
   * If profiles become partially private in the future, this method is the
   * single place to tighten view rules (for example, hide preferences for
   * non-owners while keeping basic identity public).
   * @see {@link canEditUserProfile} for profile mutation rules
   * @see {@link userService.getUserProfile} which invokes this check before loading data
   * @example
   * ```typescript
   * // Any user can view any profile
   * userPolicies.canViewUserProfile({ userId: 'alice', targetId: 'bob' }) // true
   * userPolicies.canViewUserProfile({ userId: 'bob', targetId: 'bob' }) // true
   * ```
   */
  canViewUserProfile: (_: PolicyParameters) => {
    return true
  },

  /**
   * Whether the caller may edit a user profile.
   *
   * @param params - Actor and target identifiers
   * @returns `true` when `userId` equals `targetId`; otherwise `false`
   * @throws Does not throw; returns a boolean authorization result
   * @remarks
   * **Rule:** Only the profile owner may edit identity fields (`name`,
   * `lastName`, `avatar`, `birthday`, `gender`). Cross-user edits are denied
   * even for authenticated sessions.
   * @see {@link canViewUserProfile} for read access (public)
   * @see {@link UserProfile} for editable profile fields
   * @example
   * ```typescript
   * userPolicies.canEditUserProfile({ userId: 'alice', targetId: 'bob' }) // false
   * userPolicies.canEditUserProfile({ userId: 'alice', targetId: 'alice' }) // true
   * ```
   */
  canEditUserProfile: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },

  /**
   * Whether the caller may view user preferences.
   *
   * @param params - Actor and target identifiers
   * @returns `true` when `userId` equals `targetId`; otherwise `false`
   * @throws Does not throw; returns a boolean authorization result
   * @remarks
   * **Rule:** Preferences are private. Only the owner may view
   * {@link UserPreferences} fields: `fanaticLevel`, `frequency`,
   * `preferredFormat`, `favoriteGenres`, `favoriteStudios`, and
   * `favoriteAnimes`. Other users must not read preference data even if
   * profile viewing is public.
   * @see {@link canEditUserPreferences} for mutation rules (same ownership rule)
   * @see {@link preferencesSchema} for the validated preference shape
   * @example
   * ```typescript
   * userPolicies.canViewUserPreferences({ userId: 'alice', targetId: 'bob' }) // false
   * userPolicies.canViewUserPreferences({ userId: 'alice', targetId: 'alice' }) // true
   * ```
   */
  canViewUserPreferences: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },

  /**
   * Whether the caller may edit user preferences.
   *
   * @param params - Actor and target identifiers
   * @returns `true` when `userId` equals `targetId`; otherwise `false`
   * @throws Does not throw; returns a boolean authorization result
   * @remarks
   * **Rule:** Only the owner may create or update preference fields.
   * Attempts to modify another user's `fanaticLevel`, `frequency`,
   * `preferredFormat`, or favorite lists must be rejected before persistence.
   * @see {@link canViewUserPreferences} for read rules (same ownership rule)
   * @see {@link UserPreferences}
   * @example
   * ```typescript
   * userPolicies.canEditUserPreferences({ userId: 'alice', targetId: 'bob' }) // false
   * userPolicies.canEditUserPreferences({ userId: 'alice', targetId: 'alice' }) // true
   * ```
   */
  canEditUserPreferences: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },

  /**
   * Whether the caller may view watch history.
   *
   * @param params - Actor and target identifiers
   * @returns `true` when `userId` equals `targetId`; otherwise `false`
   * @throws Does not throw; returns a boolean authorization result
   * @remarks
   * **Rule:** Watch history is private. Only the owner may view
   * {@link UserHistory.watchedAnimes}. Other users cannot enumerate which
   * anime titles another account has watched.
   * @see {@link canEditUserHistory} for mutation rules (same ownership rule)
   * @see {@link historySchema} for the validated history shape
   * @example
   * ```typescript
   * userPolicies.canViewUserHistory({ userId: 'alice', targetId: 'bob' }) // false
   * userPolicies.canViewUserHistory({ userId: 'alice', targetId: 'alice' }) // true
   * ```
   */
  canViewUserHistory: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },

  /**
   * Whether the caller may edit watch history.
   *
   * @param params - Actor and target identifiers
   * @returns `true` when `userId` equals `targetId`; otherwise `false`
   * @throws Does not throw; returns a boolean authorization result
   * @remarks
   * **Rule:** Only the owner may add, remove, or reorder entries in
   * `watchedAnimes`. Cross-user history mutation is always denied.
   * @see {@link canViewUserHistory} for read rules (same ownership rule)
   * @see {@link UserHistory}
   * @example
   * ```typescript
   * userPolicies.canEditUserHistory({ userId: 'alice', targetId: 'bob' }) // false
   * userPolicies.canEditUserHistory({ userId: 'alice', targetId: 'alice' }) // true
   * ```
   */
  canEditUserHistory: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },
}
