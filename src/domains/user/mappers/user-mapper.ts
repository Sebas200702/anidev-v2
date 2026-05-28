/**
 * Maps database user profile rows to API-facing shapes.
 *
 * @module domains/user/mappers/user-mapper
 * @remarks
 * Converts {@link UserProfileDB} persistence shape (CSV-encoded list columns,
 * nullable fields) into the nested {@link UserProfile} object validated by
 * {@link userProfileSchema}. Applies defaults such as a placeholder avatar URL
 * and empty arrays for missing list fields.
 * @see {@link UserProfile} for the output shape
 * @see {@link UserProfileDB} for the input shape
 */
import type { UserProfileDB } from '@domains/user/types/user-db-types'
import type { UserProfile, UserPreferences } from '@domains/user/types/user-types'

type MapUserProfileInput = {
  userProfile: UserProfileDB
}

/**
 * Converts a persisted profile row into a public user profile object.
 *
 * @param input - Wrapper containing the database profile row
 * @returns Normalized {@link UserProfile} for API responses and caching
 * @throws Does not throw; assumes a valid persisted row (callers validate existence)
 * @remarks
 * **Field transformations:**
 *
 * - `avatar` — falls back to `'/placeholder.webp'` when null.
 * - `birthday` — non-null asserted (`!`); expected present on persisted rows.
 * - `gender` — cast to {@link UserProfile} gender union.
 * - `favoriteAnimes`, `favoriteGenres`, `favoriteStudios`, `watchedAnimes` —
 *   comma-separated DB strings split, trimmed, parsed to integers; empty or
 *   invalid segments filtered out; missing values become `[]`.
 * - `frequency`, `fanaticLevel`, `preferredFormat` — passed through from DB
 *   nullable columns into {@link UserPreferences}.
 * @see {@link userProfileSchema} for the validated output contract
 * @see {@link userService.getUserProfile} for usage in the read pipeline
 * @example
 * ```typescript
 * const profile = mapUserProfile({ userProfile: dbRow })
 *
 * // profile.preferences.favoriteAnimes is number[]
 * // profile.history.watchedAnimes is number[]
 * ```
 */
export const mapUserProfile = ({
  userProfile,
}: MapUserProfileInput): UserProfile => {
  const preferences: UserPreferences = {
    favoriteAnimes:
      userProfile.favoriteAnimes
        ?.split(',')
        .map((id) => Number.parseInt(id.trim()))
        .filter(Boolean) || [],
    frequency: (userProfile.frequency ??
      undefined) as UserPreferences['frequency'],
    fanaticLevel: (userProfile.fanaticLevel ??
      undefined) as UserPreferences['fanaticLevel'],
    preferredFormat: userProfile.preferredFormat ?? undefined,
    favoriteGenres:
      userProfile.favoriteGenres
        ?.split(',')
        .map((genre) => Number.parseInt(genre.trim()))
        .filter(Boolean) || [],
    favoriteStudios:
      userProfile.favoriteStudios
        ?.split(',')
        .map((studio) => Number.parseInt(studio.trim()))
        .filter(Boolean) || [],
  }

  return {
    id: userProfile.id,
    avatar: userProfile.avatar ?? '/placeholder.webp',
    name: userProfile.name,
    lastName: userProfile.lastName,
    birthday: userProfile.birthday!,
    gender: userProfile.gender as UserProfile['gender'],
    preferences,
    history: {
      watchedAnimes:
        userProfile.watchedAnimes
          ?.split(',')
          .map((id) => Number.parseInt(id.trim()))
          .filter(Boolean) || [],
    },
  }
}
