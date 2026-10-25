/**
 * Errors raised by profile image uploads.
 *
 * @module domains/user/errors/profile-image-errors
 * @remarks
 * - `UNSUPPORTED_MEDIA_TYPE` → HTTP 415 (decoded format not accepted).
 * - `STORAGE_NOT_CONFIGURED` → HTTP 404 (no `S3_*` on this deployment).
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/** The uploaded bytes are not an accepted image format. */
export class UnsupportedMediaTypeError extends DomainError {
  constructor(format?: string) {
    super(
      ErrorCodes.UNSUPPORTED_MEDIA_TYPE,
      'Upload a JPEG, PNG, WebP, AVIF or GIF image',
      { format }
    )
  }
}

/**
 * Builds the 415 error for a rejected upload.
 *
 * @param format - Format sharp detected, when it decoded one
 */
export const unsupportedMediaType = (format?: string) =>
  new UnsupportedMediaTypeError(format)

/** Uploads are disabled because storage is not configured. */
export class StorageNotConfiguredError extends DomainError {
  constructor() {
    super(
      ErrorCodes.STORAGE_NOT_CONFIGURED,
      'Image uploads are not available on this deployment'
    )
  }
}

/** Builds the 404 error for uploads without storage. */
export const storageNotConfigured = () => new StorageNotConfiguredError()
