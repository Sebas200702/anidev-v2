/**
 * Reads a profile image upload (`multipart/form-data`).
 *
 * @module domains/user/utils/image-upload/util
 * @remarks
 * Routes call it after the session, owner and storage checks, so a rejected
 * caller never makes the server buffer up to 5 MiB. The declared
 * `Content-Length` is checked first; the stream is then read with the same
 * cap, which also bounds chunked bodies.
 */
import {
  MAX_PROFILE_IMAGE_BYTES,
  PROFILE_IMAGE_MULTIPART_OVERHEAD_BYTES,
} from '@user/constants'
import { unsupportedMediaType } from '@user/errors'
import { profileImageCropSchema } from '@user/schemas/profile-image-schema'
import type { ImageUpload } from '@user/utils/image-upload/types'
import { ValidationError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import { requestTooLarge } from '@shared/errors/request-errors'
import { readBoundedBytes } from '@shared/http/read-bounded-bytes'

const MAX_BODY_BYTES =
  MAX_PROFILE_IMAGE_BYTES + PROFILE_IMAGE_MULTIPART_OVERHEAD_BYTES

const CROP_FIELDS = ['x', 'y', 'width', 'height'] as const

const invalid = (message: string, details?: unknown) =>
  new ValidationError(ErrorCodes.VALIDATION_ERROR, message, details)

const readForm = async (request: Request, contentType: string) => {
  const declared = Number(request.headers.get('content-length'))
  if (declared > MAX_BODY_BYTES) throw requestTooLarge(MAX_BODY_BYTES)
  const body = await readBoundedBytes(request, MAX_BODY_BYTES)
  try {
    return await new Response(body, {
      headers: { 'Content-Type': contentType },
    }).formData()
  } catch {
    throw invalid('Malformed multipart body')
  }
}

const parseCrop = (form: FormData) => {
  const raw = Object.fromEntries(
    CROP_FIELDS.map((field) => [field, form.get(field)])
  )
  if (Object.values(raw).every((value) => value === null)) return undefined
  const result = profileImageCropSchema.safeParse(raw)
  if (!result.success) {
    throw invalid('Invalid crop box', { issues: result.error.issues })
  }
  return result.data
}

/**
 * Extracts the `file` part and the optional crop box.
 *
 * @param request - Upload request (its body is consumed)
 * @returns File bytes and crop box
 * @throws {UnsupportedMediaTypeError} When the body is not multipart
 * @throws {RequestTooLargeError} When the body or file passes 5 MiB
 * @throws {ValidationError} When `file` is missing/empty or the crop is bad
 */
export const readImageUpload = async (
  request: Request
): Promise<ImageUpload> => {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.startsWith('multipart/form-data')) {
    throw unsupportedMediaType()
  }
  const form = await readForm(request, contentType)
  const file = form.get('file')
  if (!(file instanceof Blob) || file.size === 0) {
    throw invalid('A non-empty `file` part is required')
  }
  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw requestTooLarge(MAX_PROFILE_IMAGE_BYTES)
  }
  const crop = parseCrop(form)
  return { bytes: new Uint8Array(await file.arrayBuffer()), crop }
}
