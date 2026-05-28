/**
 * Domain errors raised when an anime identifier fails validation.
 *
 * @module domains/anime/errors/anime-invalid-id-error
 * @remarks
 * Thrown before repository access when route or query `malId` values cannot be
 * coerced to a positive integer. Surfaces as HTTP **400** via
 * {@link mapErrorToHttp} because {@link AnimeInvalidIdError} extends
 * {@link ValidationError}.
 *
 * @see {@link AnimeNotFoundError} when the ID is valid but no row exists
 * @see {@link mapErrorToHttp} for HTTP status mapping
 */
import { ValidationError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Error thrown when an anime ID parameter is invalid or malformed.
 *
 * @remarks
 * - **Code:** `ANIME_INVALID_ID`
 * - **Details:** `{ rawId: unknown }` — the unvalidated value from params/query
 * - **HTTP:** 400 (`ValidationError` branch in {@link mapErrorToHttp})
 *
 * @example
 * ```typescript
 * // Route validation rejects "abc" before calling a service
 * throw animeInvalidId(params.malId)
 * ```
 */
export class AnimeInvalidIdError extends ValidationError {
  constructor(rawId: unknown) {
    super(ErrorCodes.ANIME_INVALID_ID, 'Invalid anime id', { rawId })
  }
}

/**
 * Factory for {@link AnimeInvalidIdError}.
 *
 * @param rawId - Unvalidated anime identifier from the request (string, NaN, negative, etc.)
 * @returns A {@link ValidationError} instance with code `ANIME_INVALID_ID`
 *
 * @example
 * ```typescript
 * if (!Number.isInteger(malId) || malId <= 0) {
 *   throw animeInvalidId(raw)
 * }
 * ```
 *
 * @see {@link getAnimeDetailsSchema} — Zod `z.coerce.number().int().positive()` prevents most cases at the edge
 */
export function animeInvalidId(rawId: unknown) {
  return new AnimeInvalidIdError(rawId)
}
