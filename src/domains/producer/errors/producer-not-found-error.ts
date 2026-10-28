/**
 * Not-found error for producers (studios, licensors, magazines).
 *
 * @module domains/producer/errors/producer-not-found-error
 * @remarks
 * Maps to HTTP 404 through {@link mapErrorToHttp} (`PRODUCER_NOT_FOUND` is in
 * the not-found set).
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Thrown when no `producer` row exists for a MyAnimeList id.
 *
 * - **Code:** `PRODUCER_NOT_FOUND`
 * - **Details:** `{ malId }`
 */
export class ProducerNotFoundError extends DomainError {
  constructor(malId: number) {
    super(ErrorCodes.PRODUCER_NOT_FOUND, 'Producer not found', { malId })
  }
}

/**
 * Creates a {@link ProducerNotFoundError}.
 *
 * @param malId - MyAnimeList id that was not found
 * @returns A {@link DomainError} instance with code `PRODUCER_NOT_FOUND`
 */
export const producerNotFound = (malId: number) =>
  new ProducerNotFoundError(malId)
