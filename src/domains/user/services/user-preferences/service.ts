/**
 * Owner-only update of the profile's taste preferences.
 *
 * @module domains/user/services/user-preferences/service
 */
import { userProfileCache } from '@user/cache'
import { userNotFound, userUnauthorized } from '@user/errors'
import { mapUserProfile } from '@user/mappers/user'
import { mapPreferencesPatchToDb } from '@user/mappers/user-preferences'
import { userPolicies } from '@user/policies/user'
import { catalogIdsRepository } from '@user/repositories/catalog-ids'
import { userRepository } from '@user/repositories/user'
import type { PreferencesUpdate } from '@user/schemas/user-preferences-write-schema'
import { ErrorCodes } from '@shared/errors/codes'
import { ValidationError } from '@shared/errors/validation-error'

/** Rejects ids that have no catalog row (listed per list in `details`). */
const assertCatalogIds = async (input: PreferencesUpdate) => {
  const unknownIds = await catalogIdsRepository.findMissing({
    genres: input.favoriteGenres,
    studios: input.favoriteStudios,
    animes: input.favoriteAnimes,
  })
  if (Object.values(unknownIds).some((ids) => ids.length)) {
    throw new ValidationError(
      ErrorCodes.VALIDATION_ERROR,
      'Unknown catalog ids in preferences',
      { unknownIds }
    )
  }
}

/** Taste preferences use cases. */
export const userPreferencesService = {
  /**
   * Updates the owner's preferences and invalidates the cached profile.
   *
   * @param params - `userId` (actor), `targetId` (profile) and the patch
   * @returns The updated public profile
   * @throws {UserUnauthorizedError} When the actor is not the owner (403)
   * @throws {ValidationError} When an id has no catalog row (400)
   * @throws {UserNotFoundError} When the profile does not exist (404)
   */
  async updatePreferences({
    userId,
    targetId,
    input,
  }: {
    userId: string
    targetId: string
    input: PreferencesUpdate
  }) {
    if (!userPolicies.canEditUserProfile({ userId, targetId })) {
      throw userUnauthorized(targetId)
    }
    await assertCatalogIds(input)

    const updated = await userRepository.updateProfile(
      targetId,
      mapPreferencesPatchToDb(input)
    )
    if (!updated) throw userNotFound(targetId)

    await userProfileCache.invalidate(targetId)
    return mapUserProfile({ userProfile: updated })
  },
}
