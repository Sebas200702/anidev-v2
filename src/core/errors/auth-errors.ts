import { AuthError } from '@/core/errors/errors'
import { ErrorCodes } from '@/core/errors/error-codes'

export function authRequired(details?: unknown) {
  return new AuthError(
    ErrorCodes.AUTH_REQUIRED,
    'Authentication required',
    details
  )
}

export function authInvalidToken(details?: unknown) {
  return new AuthError(
    ErrorCodes.AUTH_INVALID_TOKEN,
    'Invalid or malformed authentication token',
    details
  )
}

export function authSessionExpired(details?: unknown) {
  return new AuthError(
    ErrorCodes.AUTH_SESSION_EXPIRED,
    'Session has expired, please log in again',
    details
  )
}

export function authForbidden(details?: unknown) {
  return new AuthError(
    ErrorCodes.AUTH_FORBIDDEN,
    'You do not have permission to perform this action',
    details
  )
}
