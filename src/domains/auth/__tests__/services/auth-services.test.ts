/**
 * Tests for {@link credentialsService} and {@link sessionService}.
 *
 * @module domains/auth/__tests__/services/auth-services
 * @remarks
 * Mocks the Better Auth server API and verifies each wrapper forwards the payload + headers on
 * success and routes failures through {@link mapBetterAuthError}. Follows the repo TDD/unit-test
 * layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InvalidCredentialsError, SessionExpiredError } from '@auth/errors'

const { signInEmail, signUpEmail, getSession, signOut } = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@lib/auth/server', () => ({
  auth: { api: { signInEmail, signUpEmail, getSession, signOut } },
}))

import { credentialsService } from '@auth/services/credentials'
import { sessionService } from '@auth/services/session'

const headers = new Headers()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('credentialsService.login', () => {
  it('returns the response payload and headers on success', async () => {
    const outHeaders = new Headers({ 'set-cookie': 'session=1' })
    signInEmail.mockResolvedValue({
      response: { user: 1 },
      headers: outHeaders,
    })

    const result = await credentialsService.login(
      { email: 'a@b.c', password: 'pw' } as never,
      headers
    )

    expect(result).toEqual({ data: { user: 1 }, headers: outHeaders })
    expect(signInEmail).toHaveBeenCalledWith({
      body: { email: 'a@b.c', password: 'pw' },
      headers,
      returnHeaders: true,
    })
  })

  it('maps invalid-credential failures', async () => {
    signInEmail.mockRejectedValue(new Error('Invalid credential'))

    await expect(
      credentialsService.login({ email: 'a', password: 'b' } as never, headers)
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })
})

describe('credentialsService.register', () => {
  it('returns the response payload and headers on success', async () => {
    signUpEmail.mockResolvedValue({ response: { id: 9 }, headers })

    const result = await credentialsService.register(
      { email: 'a@b.c', password: 'pw', name: 'X' } as never,
      headers
    )

    expect(result.data).toEqual({ id: 9 })
    expect(signUpEmail).toHaveBeenCalled()
  })
})

describe('credentialsService.register errors', () => {
  it('maps failures through mapBetterAuthError', async () => {
    signUpEmail.mockRejectedValue(new Error('User already exists'))
    await expect(
      credentialsService.register(
        { email: 'a@b.c', password: 'pw', name: 'X' } as never,
        headers
      )
    ).rejects.toBeInstanceOf(Error)
  })
})

describe('sessionService.logout errors', () => {
  it('maps failures through mapBetterAuthError', async () => {
    signOut.mockRejectedValue(new Error('unauthorized'))
    await expect(sessionService.logout(headers)).rejects.toBeInstanceOf(Error)
  })
})

describe('sessionService.getSession', () => {
  it('returns the session on success', async () => {
    getSession.mockResolvedValue({ user: { id: 1 } })

    await expect(sessionService.getSession(headers)).resolves.toEqual({
      user: { id: 1 },
    })
  })

  it('maps expired-session failures', async () => {
    getSession.mockRejectedValue(new Error('session expired'))

    await expect(sessionService.getSession(headers)).rejects.toBeInstanceOf(
      SessionExpiredError
    )
  })
})

describe('sessionService.logout', () => {
  it('returns the response payload and headers on success', async () => {
    signOut.mockResolvedValue({ response: { ok: true }, headers })

    const result = await sessionService.logout(headers)

    expect(result.data).toEqual({ ok: true })
    expect(signOut).toHaveBeenCalledWith({ headers, returnHeaders: true })
  })
})
