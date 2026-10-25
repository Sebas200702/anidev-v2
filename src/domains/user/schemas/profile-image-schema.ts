/**
 * Validation for profile image requests.
 *
 * @module domains/user/schemas/profile-image-schema
 */
import { z } from 'zod'
import { PROFILE_IMAGE_MIN_CROP_SIDE } from '@user/constants'

/** Multipart text field: a missing or empty field counts as unset. */
const formInteger = (min: number) =>
  z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.coerce.number().int().min(min)
  )

/**
 * Crop box sent as multipart fields `x`, `y`, `width`, `height`, in pixels
 * of the EXIF-oriented source. All four are required once any is sent.
 */
export const profileImageCropSchema = z.object({
  x: formInteger(0),
  y: formInteger(0),
  width: formInteger(PROFILE_IMAGE_MIN_CROP_SIDE),
  height: formInteger(PROFILE_IMAGE_MIN_CROP_SIDE),
})
