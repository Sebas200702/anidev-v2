/**
 * Tests for {@link mapBetterAuthError}.
 *
 * @module domains/auth/__tests__/utils/map-better-auth-error
 * @remarks
 * Covers each message-pattern branch (invalid credentials, expired session, duplicate registration,
 * forbidden) and the non-Error / unmatched fallback. Exercising each branch also constructs the
 * corresponding auth error classes. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { mapBetterAuthError } from '@auth/utils/map-better-auth-error'
import {
  InvalidCredentialsError,
  RegistrationFailedError,
  SessionExpiredError,
} from '@auth/errors'
import { AuthError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

describe('mapBetterAuthError', () => {
  it('maps invalid credential messages', () => {
    const result = mapBetterAuthError(new Error('Invalid credential provided'))
    expect(result).toBeInstanceOf(InvalidCredentialsError)
  })

  it('maps expired session messages', () => {
    const result = mapBetterAuthError(new Error('Session has expired'))
    expect(result).toBeInstanceOf(SessionExpiredError)
  })

  it('maps duplicate/already-exists messages to registration failure', () => {
    expect(mapBetterAuthError(new Error('User already exists'))).toBeInstanceOf(
      RegistrationFailedError
    )
    expect(mapBetterAuthError(new Error('duplicate key'))).toBeInstanceOf(
      RegistrationFailedError
    )
  })

  it('maps unauthorized/forbidden messages to a forbidden AuthError', () => {
    const result = mapBetterAuthError(new Error('Forbidden action'))
    expect(result).toBeInstanceOf(AuthError)
    expect((result as AuthError).code).toBe(ErrorCodes.AUTH_FORBIDDEN)
  })

  it('falls back to AUTH_REQUIRED for unmatched errors', () => {
    const result = mapBetterAuthError(new Error('Network timeout'))
    expect(result).toBeInstanceOf(AuthError)
    expect((result as AuthError).code).toBe(ErrorCodes.AUTH_REQUIRED)
  })

  it('falls back to AUTH_REQUIRED for non-Error values', () => {
    const result = mapBetterAuthError('boom')
    expect(result).toBeInstanceOf(AuthError)
    expect((result as AuthError).code).toBe(ErrorCodes.AUTH_REQUIRED)
  })
})
