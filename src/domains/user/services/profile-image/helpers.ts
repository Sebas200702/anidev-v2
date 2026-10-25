/**
 * Helpers for the profile image service: storage keys and row access.
 *
 * @module domains/user/services/profile-image/helpers
 */
import { randomUUID } from 'node:crypto'
import { deleteObject, isStorageEnabled } from '@lib/storage'
import { userNotFound, userUnauthorized } from '@user/errors'
import { userPolicies } from '@user/policies/user'
import { userRepository } from '@user/repositories/user'
import type { ProfileImageActor } from '@user/services/profile-image/types'
import type { NewUserProfileDB } from '@user/types/user-db-types'
import type { ProfileImageKind } from '@user/utils/profile-image'
import { logger } from '@utils/logger-util'

/** Profile column holding the storage key of each image kind. */
export const KEY_COLUMN = {
  avatar: 'avatarKey',
  banner: 'bannerKey',
} as const satisfies Record<ProfileImageKind, keyof NewUserProfileDB>

/**
 * Fresh, never-reused object key for an upload.
 *
 * @param userId - Profile owner
 * @param kind - Image kind
 */
export const buildObjectKey = (userId: string, kind: ProfileImageKind) =>
  `users/${userId}/${kind}/${randomUUID()}.webp`

/**
 * Row patch that sets an image URL and its storage key together.
 *
 * @param kind - Image kind
 * @param url - Public URL, or `null` to clear
 * @param key - Storage key, or `null` for gallery picks and resets
 */
export const imagePatch = (
  kind: ProfileImageKind,
  url: string | null,
  key: string | null
): Partial<NewUserProfileDB> => ({ [kind]: url, [KEY_COLUMN[kind]]: key })

/**
 * Checks ownership and loads the profile row.
 *
 * @throws {UserUnauthorizedError} When the actor is not the owner
 * @throws {UserNotFoundError} When the profile does not exist
 */
export const loadOwnProfile = async ({
  userId,
  targetId,
}: ProfileImageActor) => {
  if (!userPolicies.canEditUserProfile({ userId, targetId })) {
    throw userUnauthorized(targetId)
  }
  const current = await userRepository.getUserProfileById(targetId)
  if (!current) throw userNotFound(targetId)
  return current
}

/**
 * Deletes an uploaded object without failing the request.
 *
 * @remarks
 * Runs after the row already points elsewhere: an orphaned object is
 * cheaper than a broken profile, so failures are only logged.
 *
 * @param key - Object key, or `null` when nothing was uploaded
 */
export const deleteQuietly = async (key: string | null) => {
  if (!key || !isStorageEnabled()) return
  try {
    await deleteObject(key)
  } catch (error) {
    logger.warn({ err: error, key }, 'Profile image delete failed')
  }
}
