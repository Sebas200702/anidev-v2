/**
 * Domain errors raised when an anime record cannot be found.
 *
 * @module domains/anime/errors/anime-not-found-error
 * @remarks
 * Thrown by {@link animeService.getAnimeDetails} and
 * {@link animeFullService.getAnimeFullByMalId} when
 * {@link animeRepository.getAnimeByMalId} returns `undefined`. Surfaces as HTTP
 * **404** via {@link mapErrorToHttp} (`ANIME_NOT_FOUND` is in the not-found set).
 *
 * @see {@link AnimeInvalidIdError} for malformed IDs (400, not 404)
 * @see {@link mapErrorToHttp}
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Error thrown when no anime exists for the given MAL ID.
 *
 * @remarks
 * - **Code:** `ANIME_NOT_FOUND`
 * - **Details:** `{ malId: number }`
 * - **HTTP:** 404 (`DomainError` + `NOT_FOUND_DOMAIN_CODES` in {@link mapErrorToHttp})
 *
 * @example
 * ```typescript
 * const row = await animeRepository.getAnimeByMalId(999999)
 * if (!row) throw animeNotFound(999999)
 * ```
 */
export class AnimeNotFoundError extends DomainError {
  constructor(malId: number) {
    super(ErrorCodes.ANIME_NOT_FOUND, 'Anime not found', { malId })
  }
}

/**
 * Factory for {@link AnimeNotFoundError}.
 *
 * @param malId - Valid MyAnimeList identifier with no matching `anime` row
 * @returns A {@link DomainError} instance with code `ANIME_NOT_FOUND`
 *
 * @example
 * ```typescript
 * throw animeNotFound(malId) // → 404 { code: 'ANIME_NOT_FOUND', meta: { details: { malId } } }
 * ```
 *
 * @see {@link animeService}
 * @see {@link animeFullService}
 */
export function animeNotFound(malId: number) {
  return new AnimeNotFoundError(malId)
}
