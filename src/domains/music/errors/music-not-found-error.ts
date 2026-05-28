/**
 * @module @domains/music/errors/music-not-found-error
 * @remarks Domain errors raised when a music record cannot be located by internal ID.
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Thrown when no music record exists for the given ID.
 *
 * @remarks Maps to {@link ErrorCodes.MUSIC_NOT_FOUND} and is typically raised by
 * {@link musicService.getMusicDetailsById} after repository lookups return no row.
 * @see {@link musicNotFound} for the factory helper
 * @see {@link musicService.getMusicDetailsById} for the primary throw site
 * @example
 * ```typescript
 * throw new MusicNotFoundError(42)
 * // { code: 'MUSIC_NOT_FOUND', message: 'Music not found', meta: { id: 42 } }
 * ```
 */
export class MusicNotFoundError extends DomainError {
  /**
   * @param id - Music identifier that was not found
   */
  constructor(id: number) {
    super(ErrorCodes.MUSIC_NOT_FOUND, 'Music not found', { id })
  }
}

/**
 * Creates a {@link MusicNotFoundError} for the given music ID.
 *
 * @remarks Prefer this factory over `new MusicNotFoundError()` for consistent construction.
 * @param id - Music identifier that was not found
 * @returns Configured not-found error instance
 * @throws Does not throw; returns an error instance for the caller to throw
 * @see {@link MusicNotFoundError}
 * @example
 * ```typescript
 * const music = await musicRepository.getMusicById(id)
 * if (!music) throw musicNotFound(id)
 * ```
 */
export function musicNotFound(id: number) {
  return new MusicNotFoundError(id)
}
