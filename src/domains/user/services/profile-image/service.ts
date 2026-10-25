/**
 * Profile avatar and banner: uploads, gallery picks and resets.
 *
 * @module domains/user/services/profile-image/service
 * @remarks
 * Write order for uploads: store the new object, update the row, invalidate
 * the cached profile, then delete the previous object. A failed row update
 * deletes the new object, so no orphan is left behind.
 */
import { buildMediaUrl } from '@media/mappers/media-url'
import { characterProfileRepository } from '@people/repositories/character-profile'
import { isStorageEnabled, publicUrl, putObject } from '@lib/storage'
import { userProfileCache } from '@user/cache'
import { PROFILE_IMAGE_CONTENT_TYPE } from '@user/constants'
import { storageNotConfigured, userNotFound } from '@user/errors'
import { mapUserProfile } from '@user/mappers/user'
import { profileGalleryRepository } from '@user/repositories/profile-gallery'
import { userRepository } from '@user/repositories/user'
import {
  buildObjectKey,
  deleteQuietly,
  imagePatch,
  KEY_COLUMN,
  loadOwnProfile,
} from '@user/services/profile-image/helpers'
import type {
  ProfileImageActor,
  ResetProfileImageInput,
  UploadProfileImageInput,
} from '@user/services/profile-image/types'
import type { ProfileImageKind } from '@user/utils/profile-image'
import { processProfileImage } from '@user/utils/profile-image'
import { ValidationError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

const invalidPick = (message: string, details: unknown) =>
  new ValidationError(ErrorCodes.VALIDATION_ERROR, message, details)

/** Points `kind` at `url` (no stored object) and drops any previous upload. */
const setImage = async (
  actor: ProfileImageActor,
  kind: ProfileImageKind,
  url: string | null
) => {
  const current = await loadOwnProfile(actor)
  const updated = await userRepository.updateProfile(
    actor.targetId,
    imagePatch(kind, url, null)
  )
  if (!updated) throw userNotFound(actor.targetId)
  await userProfileCache.invalidate(actor.targetId)
  await deleteQuietly(current[KEY_COLUMN[kind]])
  return mapUserProfile({ userProfile: updated })
}

/** Updates the row to the new object, removing that object if it fails. */
const commitUpload = async (
  targetId: string,
  kind: ProfileImageKind,
  key: string
) => {
  try {
    const updated = await userRepository.updateProfile(
      targetId,
      imagePatch(kind, publicUrl(key), key)
    )
    if (!updated) throw userNotFound(targetId)
    return updated
  } catch (error) {
    await deleteQuietly(key)
    throw error
  }
}

export const profileImageService = {
  /**
   * Processes and stores an uploaded avatar or banner.
   *
   * @returns The updated public profile
   * @throws {UserUnauthorizedError} When the actor is not the owner
   * @throws {StorageNotConfiguredError} When `S3_*` is not set (404)
   * @throws {UserNotFoundError} When the profile does not exist (404)
   * @throws {UnsupportedMediaTypeError} When the file is not an image (415)
   * @throws {ValidationError} When the crop box is outside the image (400)
   */
  async upload({ kind, upload, ...actor }: UploadProfileImageInput) {
    if (!isStorageEnabled()) throw storageNotConfigured()
    const current = await loadOwnProfile(actor)
    const bytes = await processProfileImage({ ...upload, kind })
    const key = buildObjectKey(actor.targetId, kind)
    await putObject(key, bytes, PROFILE_IMAGE_CONTENT_TYPE)

    const updated = await commitUpload(actor.targetId, kind, key)
    await userProfileCache.invalidate(actor.targetId)
    await deleteQuietly(current[KEY_COLUMN[kind]])
    return mapUserProfile({ userProfile: updated })
  },

  /**
   * Uses a character portrait from the catalog as the avatar.
   *
   * @throws {ValidationError} When the character does not exist or still has
   *   a provisional name (400)
   */
  async pickCharacterAvatar({
    characterId,
    ...actor
  }: ProfileImageActor & { characterId: number }) {
    const found = await characterProfileRepository.getCharacter(characterId)
    if (!found) throw invalidPick('Unknown character', { characterId })
    const url = buildMediaUrl({
      entity: 'character',
      entity_id: characterId,
      type: 'poster',
      size: 'large',
    })
    return setImage(actor, 'avatar', url)
  },

  /**
   * Uses an anime banner from the catalog as the profile banner.
   *
   * @throws {ValidationError} When the anime does not exist, is adult-rated
   *   or has no banner media (400)
   */
  async pickAnimeBanner({
    animeId,
    ...actor
  }: ProfileImageActor & { animeId: number }) {
    if (!(await profileGalleryRepository.hasSafeAnimeBanner(animeId))) {
      throw invalidPick('Anime has no usable banner', { animeId })
    }
    const url = buildMediaUrl({
      entity: 'anime',
      entity_id: animeId,
      type: 'banner',
    })
    return setImage(actor, 'banner', url)
  },

  /** Clears the image (the DTO falls back to the default). */
  async reset({ kind, ...actor }: ResetProfileImageInput) {
    return setImage(actor, kind, null)
  },
}
