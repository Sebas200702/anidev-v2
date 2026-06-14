/**
 * Public exports for anime domain errors.
 *
 * @module domains/anime/errors
 * @remarks
 * Barrel for validation and not-found errors used by anime services and API
 * routes. Pair with {@link mapErrorToHttp} at the HTTP boundary.
 *
 * @see {@link AnimeInvalidIdError} — HTTP 400
 * @see {@link AnimeNotFoundError} — HTTP 404
 */

export { AnimeInvalidIdError, animeInvalidId } from './anime-invalid-id-error'
export { AnimeNotFoundError, animeNotFound } from './anime-not-found-error'
