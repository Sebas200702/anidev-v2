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
import type { NewUserProfileDB } from '@user/types/user-db-types'
import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from '@user/services/user/types'
import type { MapUserProfileInput } from './types'

/**
 * Input for {@link mapProfileIdentityToDb}.
 *
 * @remarks
 * The session user id is required (it is the row primary key) and the API
 * identity payload comes from {@link createUserProfileSchema}.
 */
export interface MapProfileIdentityToDbInput {
  id: string
  input: CreateUserProfileInput
}

/**
 * Builds a full insertable profile row from identity-only create input.
 *
 * @param params - Session user id and the validated create body
 * @returns A {@link NewUserProfileDB} row ready to hand to the repository
 * @throws Does not throw; all columns are defaulted to neutral values
 * @remarks
 * `profile.id` and `profile.userId` are set to the session user id. List
 * columns are initialized as empty CSV strings so reads can still parse them.
 * Preference and history fields are NOT mutated by this mapper — they stay
 * `null`/`''` until a dedicated endpoint lands.
 * @see {@link userRepository.createProfile}
 * @see {@link createUserProfileSchema}
 * @example
 * ```typescript
 * const row = mapProfileIdentityToDb({ id: sessionId, input })
 * await userRepository.createProfile(row)
 * ```
 */
export const mapProfileIdentityToDb = ({
  id,
  input,
}: MapProfileIdentityToDbInput): NewUserProfileDB => {
  const { body } = input
  return {
    id,
    userId: id,
    name: body.name,
    lastName: body.lastName,
    avatar: body.avatar ?? null,
    birthday: body.birthday ?? null,
    gender: body.gender,
    favoriteAnimes: '',
    favoriteGenres: '',
    favoriteStudios: '',
    frequency: null,
    fanaticLevel: null,
    preferredFormat: null,
    watchedAnimes: '',
  }
}

/**
 * Projects a partial update body to DB column updates only.
 *
 * @param input - Validated patch body
 * @returns Sparse DB partial with only the provided identity fields
 * @throws Does not throw; absence is preserved as `undefined`
 * @remarks
 * The repository passes this to Drizzle's `set` so unspecified columns stay
 * unchanged. Preference and history fields are not accepted by the schema
 * and so cannot leak into updates here.
 * @see {@link updateUserProfileSchema}
 */
export const mapProfileIdentityPatchToDb = (
  input: UpdateUserProfileInput
): Partial<NewUserProfileDB> => {
  const { body } = input
  const patch: Partial<NewUserProfileDB> = {}
  if (body.name !== undefined) patch.name = body.name
  if (body.lastName !== undefined) patch.lastName = body.lastName
  if (body.avatar !== undefined) patch.avatar = body.avatar
  if (body.birthday !== undefined) patch.birthday = body.birthday
  if (body.gender !== undefined) patch.gender = body.gender
  return patch
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
export const mapUserProfile = ({
  userProfile,
}: MapUserProfileInput): UserProfile => {
  const preferences: UserPreferences = {
    favoriteAnimes:
      userProfile.favoriteAnimes
        ?.split(',')
        .map((id) => Number.parseInt(id.trim(), 10))
        .filter(Boolean) || [],
    frequency: (userProfile.frequency ??
      undefined) as UserPreferences['frequency'],
    fanaticLevel: (userProfile.fanaticLevel ??
      undefined) as UserPreferences['fanaticLevel'],
    preferredFormat: userProfile.preferredFormat ?? undefined,
    favoriteGenres:
      userProfile.favoriteGenres
        ?.split(',')
        .map((genre) => Number.parseInt(genre.trim(), 10))
        .filter(Boolean) || [],
    favoriteStudios:
      userProfile.favoriteStudios
        ?.split(',')
        .map((studio) => Number.parseInt(studio.trim(), 10))
        .filter(Boolean) || [],
  }

  return {
    id: userProfile.id,
    avatar: userProfile.avatar ?? '/placeholder.webp',
    name: userProfile.name,
    lastName: userProfile.lastName,
    birthday: userProfile.birthday ?? undefined,
    gender: userProfile.gender as UserProfile['gender'],
    preferences,
    history: {
      watchedAnimes:
        userProfile.watchedAnimes
          ?.split(',')
          .map((id) => Number.parseInt(id.trim(), 10))
          .filter(Boolean) || [],
    },
  }
}
