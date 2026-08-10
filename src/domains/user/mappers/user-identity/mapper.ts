/**
 * Maps API identity payloads to database user profile write shapes.
 *
 * @module domains/user/mappers/user-identity/mapper
 * @remarks
 * Reverse of {@link mapUserProfile}: converts the validated create/update
 * identity surface (`name`, `lastName`, `avatar`, `birthday`, `gender`) into
 * {@link NewUserProfileDB} insert rows and sparse update patches. Preference
 * and history columns are never touched here — they are governed by other
 * endpoints.
 * @see {@link mapUserProfile} for the DB → API read direction
 * @see {@link userRepository.createProfile}
 * @see {@link userRepository.updateProfile}
 */
import type { NewUserProfileDB } from '@user/types/user-db-types'
import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from '@user/services/user/types'

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
