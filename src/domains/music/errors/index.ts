import { DomainError, ValidationError } from '@/core/errors/errors'
import { ErrorCodes } from '@/core/errors/error-codes'

export function musicNotFound(id: number) {
  return new DomainError(ErrorCodes.MUSIC_NOT_FOUND, 'Music not found', {
    id: id,
  })
}

export function musicInvalidId(rawId: unknown) {
  return new ValidationError(ErrorCodes.MUSIC_INVALID_ID, 'Invalid music id', {
    rawId,
  })
}
