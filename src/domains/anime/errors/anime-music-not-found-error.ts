/**
 * Domain error raised when an anime exists but has no opening or ending with
 * the requested music id.
 *
 * @module domains/anime/errors/anime-music-not-found-error
 * @remarks
 * Thrown by {@link animeMusicService.getMusicItem} after confirming the parent
 * anime exists; an id linked to another anime (or not a theme) is treated as
 * missing. Surfaces as HTTP **404** via {@link mapErrorToHttp}.
 *
 * @see {@link AnimeNotFoundError}
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Error thrown when no music with the given id is linked to an anime.
 *
 * @remarks
 * - **Code:** `MUSIC_NOT_FOUND`
 * - **Details:** `{ malId: number, musicId: number }`
 * - **HTTP:** 404
 */
export class AnimeMusicNotFoundError extends DomainError {
  constructor(malId: number, musicId: number) {
    super(ErrorCodes.MUSIC_NOT_FOUND, 'Music not found', { malId, musicId })
  }
}

/**
 * Factory for {@link AnimeMusicNotFoundError}.
 *
 * @param malId - Parent anime MAL ID (known to exist)
 * @param musicId - `music.id` not linked to that anime as a theme
 * @returns A {@link DomainError} with code `MUSIC_NOT_FOUND`
 *
 * @example
 * ```typescript
 * throw animeMusicNotFound(1, 42) // → 404 { code: 'MUSIC_NOT_FOUND' }
 * ```
 */
export const animeMusicNotFound = (malId: number, musicId: number) =>
  new AnimeMusicNotFoundError(malId, musicId)
