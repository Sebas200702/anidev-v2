/**
 * Types for profile image upload parsing.
 *
 * @module domains/user/utils/image-upload/types
 */
import type { ProfileImageCrop } from '@user/utils/profile-image'

/** Parsed upload: raw file bytes plus the optional crop box. */
export interface ImageUpload {
  bytes: Uint8Array
  crop?: ProfileImageCrop
}
