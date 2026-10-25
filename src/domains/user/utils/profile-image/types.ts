/**
 * Types for profile image processing.
 *
 * @module domains/user/utils/profile-image/types
 */
import type { PROFILE_IMAGE_KINDS } from '@user/constants'

/** Which profile image is being set. */
export type ProfileImageKind = (typeof PROFILE_IMAGE_KINDS)[number]

/** Crop box in pixels of the EXIF-oriented source image. */
export interface ProfileImageCrop {
  x: number
  y: number
  width: number
  height: number
}

/** Input of {@link processProfileImage}. */
export interface ProcessProfileImageInput {
  bytes: Uint8Array
  kind: ProfileImageKind
  crop?: ProfileImageCrop
}
