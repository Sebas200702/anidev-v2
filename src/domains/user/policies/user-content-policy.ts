/**
 * Authorization policies for private user content (preferences and watch history).
 *
 * @module domains/user/policies/user-content-policy
 * @remarks
 * Pure, synchronous predicates: preferences and watch history are owner-only for both read and
 * write. Composed into {@link userPolicies}.
 *
 * @see {@link PolicyParameters}
 */
import type { PolicyParameters } from '@domains/user/types/user-policies-types'

/**
 * Preference and watch-history view/edit policy checks (owner-only).
 *
 * @remarks Each `can*` method is a pure predicate; denied access should surface as
 * {@link UserUnauthorizedError} from the calling service or route handler.
 */
export const userContentPolicies = {
  /**
   * Whether the caller may view user preferences.
   *
   * @param params - Actor and target identifiers
   * @returns `true` when `userId` equals `targetId`; otherwise `false`
   * @remarks
   * **Rule:** Preferences are private. Only the owner may view
   * {@link UserPreferences} fields: `fanaticLevel`, `frequency`,
   * `preferredFormat`, `favoriteGenres`, `favoriteStudios`, and
   * `favoriteAnimes`. Other users must not read preference data even if
   * profile viewing is public.
   * @see {@link canEditUserPreferences} for mutation rules (same ownership rule)
   * @see {@link preferencesSchema} for the validated preference shape
   */
  canViewUserPreferences: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },

  /**
   * Whether the caller may edit user preferences.
   *
   * @param params - Actor and target identifiers
   * @returns `true` when `userId` equals `targetId`; otherwise `false`
   * @remarks
   * **Rule:** Only the owner may create or update preference fields.
   * Attempts to modify another user's `fanaticLevel`, `frequency`,
   * `preferredFormat`, or favorite lists must be rejected before persistence.
   * @see {@link canViewUserPreferences} for read rules (same ownership rule)
   * @see {@link UserPreferences}
   */
  canEditUserPreferences: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },

  /**
   * Whether the caller may view watch history.
   *
   * @param params - Actor and target identifiers
   * @returns `true` when `userId` equals `targetId`; otherwise `false`
   * @remarks
   * **Rule:** Watch history is private. Only the owner may view
   * {@link UserHistory.watchedAnimes}. Other users cannot enumerate which
   * anime titles another account has watched.
   * @see {@link canEditUserHistory} for mutation rules (same ownership rule)
   * @see {@link historySchema} for the validated history shape
   */
  canViewUserHistory: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },

  /**
   * Whether the caller may edit watch history.
   *
   * @param params - Actor and target identifiers
   * @returns `true` when `userId` equals `targetId`; otherwise `false`
   * @remarks
   * **Rule:** Only the owner may add, remove, or reorder entries in
   * `watchedAnimes`. Cross-user history mutation is always denied.
   * @see {@link canViewUserHistory} for read rules (same ownership rule)
   * @see {@link UserHistory}
   */
  canEditUserHistory: ({ userId, targetId }: PolicyParameters) => {
    return userId === targetId
  },
}
