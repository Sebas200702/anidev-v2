import { DomainError, ValidationError } from '@/core/errors/errors'
import { ErrorCodes } from '@/core/errors/error-codes'

export function animeNotFound(malId: number) {
  return new DomainError(ErrorCodes.ANIME_NOT_FOUND, 'Anime not found', {
    malId,
  })
}

export function animeInvalidId(rawId: unknown) {
  return new ValidationError(ErrorCodes.ANIME_INVALID_ID, 'Invalid anime id', {
    rawId,
  })
}
