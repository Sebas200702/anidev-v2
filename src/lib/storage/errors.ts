/**
 * Error factory for object storage failures.
 *
 * @module lib/storage/errors
 */
import { InfraError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Builds the infra error raised when an S3 call fails.
 *
 * @param operation - Storage operation that failed (`put`, `delete`)
 * @param key - Object key involved
 * @param cause - Underlying SDK error
 * @returns {@link InfraError} with `STORAGE_ERROR` (HTTP 503)
 */
export const storageError = (operation: string, key: string, cause: unknown) =>
  new InfraError(
    ErrorCodes.STORAGE_ERROR,
    `Storage error during ${operation}`,
    { key },
    cause
  )
