
import { DomainError, ValidationError, AuthError } from '@/core/errors/errors'
import { ErrorCodes } from '@/core/errors/error-codes'

export function userNotFound(id: string) {
  return new DomainError(ErrorCodes.USER_NOT_FOUND, 'User not found', {
    id,
  })
}

export function userInvalidId(rawId: unknown) {
  return new ValidationError(ErrorCodes.USER_INVALID_ID, 'Invalid user id', {
    rawId,
  })
}

export function userUnauthorized(userId: string) {
  return new AuthError(ErrorCodes.USER_UNAUTHORIZED, 'Unauthorized user', {
    userId,
  })
}
