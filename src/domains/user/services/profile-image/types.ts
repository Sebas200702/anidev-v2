/**
 * Types for the profile image service.
 *
 * @module domains/user/services/profile-image/types
 */
import type { ImageUpload } from '@user/utils/image-upload'
import type { ProfileImageKind } from '@user/utils/profile-image'

/** Actor (`userId`) and profile being changed (`targetId`). */
export interface ProfileImageActor {
  userId: string
  targetId: string
}

/** Input of `profileImageService.upload`. */
export interface UploadProfileImageInput extends ProfileImageActor {
  kind: ProfileImageKind
  upload: ImageUpload
}

/** Input of `profileImageService.reset`. */
export interface ResetProfileImageInput extends ProfileImageActor {
  kind: ProfileImageKind
}
