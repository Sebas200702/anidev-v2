/**
 * Authorization policies for public user profile access.
 *
 * @module domains/user/policies/user-profile-policy
 * @remarks
 * Pure, synchronous predicates: profiles are publicly viewable but editable by their owner only.
 * Composed into {@link userPolicies}.
 *
 * @see {@link PolicyParameters}
 */
import type { PolicyParameters } from '@domains/user/types/user-policies-types'

/**
 * Profile view/edit policy checks.
 *
 * @remarks Each `can*` method is a pure predicate; denied access should surface as
 * {@link UserUnauthorizedError} from the calling service or route handler.
 */
export const userProfilePolicies = {
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
}
