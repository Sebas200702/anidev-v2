/**
 * Domain error raised when an anime exists but has no media asset with the
 * requested id.
 *
 * @module domains/anime/errors/anime-media-not-found-error
 * @remarks
 * Thrown by {@link animeMediaService.getMediaItem} after confirming the parent
 * anime exists; an id that belongs to another anime is treated as missing.
 * Surfaces as HTTP **404** via {@link mapErrorToHttp}.
 *
 * @see {@link AnimeNotFoundError}
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Error thrown when no media asset with the given id exists for an anime.
 *
 * @remarks
 * - **Code:** `MEDIA_NOT_FOUND`
 * - **Details:** `{ malId: number, mediaId: number }`
 * - **HTTP:** 404
 */
export class AnimeMediaNotFoundError extends DomainError {
  constructor(malId: number, mediaId: number) {
    super(ErrorCodes.MEDIA_NOT_FOUND, 'Media not found', { malId, mediaId })
  }
}

/**
 * Factory for {@link AnimeMediaNotFoundError}.
 *
 * @param malId - Parent anime MAL ID (known to exist)
 * @param mediaId - `anime_media.id` with no matching row for that anime
 * @returns A {@link DomainError} with code `MEDIA_NOT_FOUND`
 *
 * @example
 * ```typescript
 * throw animeMediaNotFound(1, 42) // → 404 { code: 'MEDIA_NOT_FOUND' }
 * ```
 */
export const animeMediaNotFound = (malId: number, mediaId: number) =>
  new AnimeMediaNotFoundError(malId, mediaId)
