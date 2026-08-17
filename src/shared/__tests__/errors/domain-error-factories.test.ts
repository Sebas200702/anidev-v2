/**
 * Tests for the invalid-id validation errors and the auth-error factories.
 *
 * @module shared/__tests__/errors/domain-error-factories
 * @remarks
 * Covers each `*InvalidId` factory (anime/music/user) and the `auth*` factory helpers, asserting
 * their error codes and that the raw id / details are carried through. Follows the repo
 * TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { AuthError, ValidationError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import { animeInvalidId } from '@anime/errors'
import { musicInvalidId } from '@music/errors'
import { userInvalidId } from '@user/errors'
import {
  authForbidden,
  authInvalidToken,
  authRequired,
  authSessionExpired,
} from '@shared/errors/auth-errors'

describe('invalid-id factories', () => {
  it.each([
    [animeInvalidId, ErrorCodes.ANIME_INVALID_ID],
    [musicInvalidId, ErrorCodes.MUSIC_INVALID_ID],
    [userInvalidId, ErrorCodes.USER_INVALID_ID],
  ])('builds a ValidationError with the right code', (factory, code) => {
    const error = factory('bad')
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.code).toBe(code)
    expect(error.details).toEqual({ rawId: 'bad' })
  })
})

describe('auth-error factories', () => {
  it.each([
    [authRequired, ErrorCodes.AUTH_REQUIRED],
    [authInvalidToken, ErrorCodes.AUTH_INVALID_TOKEN],
    [authSessionExpired, ErrorCodes.AUTH_SESSION_EXPIRED],
    [authForbidden, ErrorCodes.AUTH_FORBIDDEN],
  ])('builds an AuthError with the right code', (factory, code) => {
    const error = factory({ ctx: 1 })
    expect(error).toBeInstanceOf(AuthError)
    expect(error.code).toBe(code)
  })
})
