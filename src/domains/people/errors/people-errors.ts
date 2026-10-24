/**
 * Not-found errors of the people domain (characters and persons).
 *
 * @module domains/people/errors/people-errors
 * @remarks Both codes are in the 404 set of {@link mapErrorToHttp}.
 */
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Character id that does not exist or still has a provisional name.
 *
 * @param malId - MyAnimeList character id
 * @returns A `DomainError` with code `CHARACTER_NOT_FOUND`
 */
export const characterNotFound = (malId: number) =>
  new DomainError(ErrorCodes.CHARACTER_NOT_FOUND, 'Character not found', {
    malId,
  })

/**
 * Person (staff, voice actor, author) id that does not exist.
 *
 * @param malId - MyAnimeList person id
 * @returns A `DomainError` with code `PERSON_NOT_FOUND`
 */
export const personNotFound = (malId: number) =>
  new DomainError(ErrorCodes.PERSON_NOT_FOUND, 'Person not found', { malId })
