/**
 * Domain error raised when a printed-media (manga) record cannot be found.
 *
 * @module domains/manga/errors/manga-not-found-error
 * @remarks
 * Thrown by {@link mangaDetailsService.getMangaDetails} when the repository
 * returns no row. Surfaces as HTTP **404** via {@link mapErrorToHttp}
 * (`MANGA_NOT_FOUND` is in the not-found set).
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Error thrown when no printed work exists for the given MAL ID.
 *
 * @remarks
 * - **Code:** `MANGA_NOT_FOUND`
 * - **Details:** `{ malId: number }`
 * - **HTTP:** 404
 */
export class MangaNotFoundError extends DomainError {
  constructor(malId: number) {
    super(ErrorCodes.MANGA_NOT_FOUND, 'Manga not found', { malId })
  }
}

/**
 * Factory for {@link MangaNotFoundError}.
 *
 * @param malId - Valid MyAnimeList identifier with no matching `manga` row
 * @returns A {@link DomainError} instance with code `MANGA_NOT_FOUND`
 */
export const mangaNotFound = (malId: number) => {
  return new MangaNotFoundError(malId)
}
