/**
 * Maps database user profile rows to API-facing shapes.
 *
 * @module domains/user/mappers/user/mapper
 * @remarks
 * Converts {@link UserProfileDB} persistence shape (CSV-encoded list columns,
 * nullable fields) into the nested {@link UserProfile} object validated by
 * {@link userProfileSchema}. Applies defaults such as a placeholder avatar URL
 * and empty arrays for missing list fields.
 * @see {@link UserProfile} for the output shape
 * @see {@link UserProfileDB} for the input shape
 */
import type { UserProfile, UserPreferences } from '@user/types/user-types'
import type { MapUserProfileInput } from './types'

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
 * - `banner` — `null` until the owner uploads or picks one; storage keys are
 *   never exposed.
 * - `birthday` — mapped with `?? undefined` so a nullable DB value becomes an
 *   absent field (matches the optional schema).
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
const parseIdList = (value: string | null): number[] =>
  (value ?? '')
    .split(',')
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((entry): entry is number => Number.isInteger(entry))

const normalizeGender = (
  value: string | null
): UserProfile['gender'] | undefined => {
  if (value === 'male' || value === 'female' || value === 'other') {
    return value
  }
  return undefined
}

const normalizeFrequency = (
  value: string | null
): UserPreferences['frequency'] | undefined => {
  if (value === 'daily' || value === 'weekly' || value === 'monthly') {
    return value
  }
  return undefined
}

const normalizeFanaticLevel = (
  value: string | null
): UserPreferences['fanaticLevel'] | undefined => {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value
  }
  return undefined
}

export const mapUserProfile = ({
  userProfile,
}: MapUserProfileInput): UserProfile => {
  const preferences: UserPreferences = {
    favoriteAnimes: parseIdList(userProfile.favoriteAnimes),
    frequency: normalizeFrequency(userProfile.frequency),
    fanaticLevel: normalizeFanaticLevel(userProfile.fanaticLevel),
    preferredFormat: userProfile.preferredFormat ?? undefined,
    favoriteGenres: parseIdList(userProfile.favoriteGenres),
    favoriteStudios: parseIdList(userProfile.favoriteStudios),
  }

  return {
    id: userProfile.id,
    avatar: userProfile.avatar ?? '/placeholder.webp',
    banner: userProfile.banner,
    name: userProfile.name,
    lastName: userProfile.lastName,
    birthday: userProfile.birthday ?? undefined,
    gender: normalizeGender(userProfile.gender),
    preferences,
    history: {
      watchedAnimes: parseIdList(userProfile.watchedAnimes),
    },
  }
}
