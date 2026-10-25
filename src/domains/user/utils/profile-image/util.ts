/**
 * Decodes, crops and re-encodes a profile image upload.
 *
 * @module domains/user/utils/profile-image/util
 * @remarks
 * The format comes from the decoded content, never from the file name or the
 * client MIME type. Only the first frame is read, EXIF orientation is applied
 * at load, and the WebP output carries no metadata (sharp drops it unless
 * `withMetadata` is called).
 */
import sharp, { type Sharp } from 'sharp'
import {
  PROFILE_IMAGE_HEIF_COMPRESSION,
  PROFILE_IMAGE_INPUT_FORMATS,
  PROFILE_IMAGE_MAX_INPUT_PIXELS,
  PROFILE_IMAGE_SIZES,
  PROFILE_IMAGE_WEBP_QUALITY,
} from '@user/constants'
import { unsupportedMediaType } from '@user/errors'
import { ValidationError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import type {
  ProcessProfileImageInput,
  ProfileImageCrop,
} from '@user/utils/profile-image/types'

const isAcceptedFormat = (format?: string, compression?: string) => {
  const accepted: readonly string[] = PROFILE_IMAGE_INPUT_FORMATS
  if (!format || !accepted.includes(format)) {
    return false
  }
  return format !== 'heif' || compression === PROFILE_IMAGE_HEIF_COMPRESSION
}

const readMetadata = async (image: Sharp) => {
  try {
    return await image.metadata()
  } catch {
    throw unsupportedMediaType()
  }
}

const assertCropFits = (
  crop: ProfileImageCrop,
  size: { width: number; height: number }
) => {
  if (crop.x + crop.width <= size.width && crop.y + crop.height <= size.height)
    return
  throw new ValidationError(
    ErrorCodes.VALIDATION_ERROR,
    'Crop box does not fit inside the image',
    { crop, size }
  )
}

/**
 * Turns an uploaded image into the stored WebP for `kind`.
 *
 * @param input - Raw bytes, target kind and optional crop box
 * @returns WebP bytes at the kind's fixed size
 * @throws {UnsupportedMediaTypeError} When the content is not an accepted
 *   image (SVG, text, HEIC, corrupt or oversized pixel data)
 * @throws {ValidationError} When the crop box is outside the image
 */
export const processProfileImage = async ({
  bytes,
  kind,
  crop,
}: ProcessProfileImageInput): Promise<Uint8Array> => {
  const image = sharp(bytes, {
    autoOrient: true,
    failOn: 'error',
    limitInputPixels: PROFILE_IMAGE_MAX_INPUT_PIXELS,
    pages: 1,
  })
  const { format, compression, autoOrient } = await readMetadata(image)
  if (!isAcceptedFormat(format, compression)) throw unsupportedMediaType(format)

  if (crop) {
    assertCropFits(crop, autoOrient)
    image.extract({
      left: crop.x,
      top: crop.y,
      width: crop.width,
      height: crop.height,
    })
  }

  const { width, height } = PROFILE_IMAGE_SIZES[kind]
  try {
    return await image
      .resize(width, height, { fit: 'cover' })
      .webp({ quality: PROFILE_IMAGE_WEBP_QUALITY })
      .toBuffer()
  } catch {
    throw unsupportedMediaType(format)
  }
}
