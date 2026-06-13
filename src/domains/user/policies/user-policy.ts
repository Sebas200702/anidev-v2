/**
 * Authorization policies for user-owned resources.
 *
 * @module domains/user/policies/user-policy
 * @remarks
 * Pure, synchronous policy functions evaluate whether an authenticated actor
 * (`userId`) may access a resource owned by `targetId`. Policies are invoked
 * by services before reads or writes; they never perform I/O.
 *
 * Profile policies live in {@link user-profile-policy}; preference/history policies in
 * {@link user-content-policy}. {@link userPolicies} composes both.
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
import { userProfilePolicies } from '@domains/user/policies/user-profile-policy'
import { userContentPolicies } from '@domains/user/policies/user-content-policy'

/**
 * Policy checks for profile, preferences, and watch-history access.
 *
 * @remarks
 * Each `can*` method is a pure predicate. Denied access should surface as
 * {@link UserUnauthorizedError} from the calling service or route handler.
 * @see {@link PolicyParameters}
 */
export const userPolicies = {
  ...userProfilePolicies,
  ...userContentPolicies,
}
