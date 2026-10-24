/**
 * Domain error raised when an anime exists but lacks the requested episode.
 *
 * @module domains/anime/errors/episode-not-found-error
 * @remarks
 * Thrown by {@link animeEpisodesService.getEpisode} after confirming the parent
 * anime exists; a missing anime raises {@link AnimeNotFoundError} instead.
 * Surfaces as HTTP **404** via {@link mapErrorToHttp}.
 *
 * @see {@link AnimeNotFoundError}
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Error thrown when no episode with the given number exists for an anime.
 *
 * @remarks
 * - **Code:** `EPISODE_NOT_FOUND`
 * - **Details:** `{ malId: number, number: number }`
 * - **HTTP:** 404
 */
export class EpisodeNotFoundError extends DomainError {
  constructor(malId: number, number: number) {
    super(ErrorCodes.EPISODE_NOT_FOUND, 'Episode not found', { malId, number })
  }
}

/**
 * Factory for {@link EpisodeNotFoundError}.
 *
 * @param malId - Parent anime MAL ID (known to exist)
 * @param number - Episode number with no matching row
 * @returns A {@link DomainError} with code `EPISODE_NOT_FOUND`
 *
 * @example
 * ```typescript
 * throw episodeNotFound(1, 999) // → 404 { code: 'EPISODE_NOT_FOUND' }
 * ```
 */
export const episodeNotFound = (malId: number, number: number) =>
  new EpisodeNotFoundError(malId, number)
