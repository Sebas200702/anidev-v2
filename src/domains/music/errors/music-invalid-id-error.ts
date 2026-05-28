/**
 * @module @domains/music/errors/music-invalid-id-error
 * @remarks Validation errors raised when route or query parameters cannot be parsed into
 * a valid internal music identifier.
 */
import { ValidationError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Thrown when a route or query parameter is not a valid music ID.
 *
 * @remarks Maps to {@link ErrorCodes.MUSIC_INVALID_ID}. The raw unparsed value is attached
 * to error metadata for logging and client diagnostics.
 * @see {@link musicInvalidId} for the factory helper
 * @example
 * ```typescript
 * throw new MusicInvalidIdError('abc')
 * // { code: 'MUSIC_INVALID_ID', message: 'Invalid music id', meta: { rawId: 'abc' } }
 * ```
 */
export class MusicInvalidIdError extends ValidationError {
  /**
   * @param rawId - Unparsed identifier from the request
   */
  constructor(rawId: unknown) {
    super(ErrorCodes.MUSIC_INVALID_ID, 'Invalid music id', { rawId })
  }
}

/**
 * Creates a {@link MusicInvalidIdError} for an invalid identifier.
 *
 * @remarks Use after Zod or manual parsing fails on music route params.
 * @param rawId - Unparsed identifier from the request
 * @returns Configured validation error instance
 * @throws Does not throw; returns an error instance for the caller to throw
 * @see {@link MusicInvalidIdError}
 * @example
 * ```typescript
 * const id = Number(params.id)
 * if (!Number.isFinite(id)) throw musicInvalidId(params.id)
 * ```
 */
export function musicInvalidId(rawId: unknown) {
  return new MusicInvalidIdError(rawId)
}
