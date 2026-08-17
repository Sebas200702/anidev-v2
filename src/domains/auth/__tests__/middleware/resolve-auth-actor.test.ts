/**
 * Tests for {@link resolveAuthActor}.
 *
 * @module domains/auth/__tests__/middleware/resolve-auth-actor
 * @remarks
 * Mocks the Better Auth server API. Covers the authenticated result, the null-session result, and
 * the swallow-error contract (never throws — returns nulls). Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('@lib/auth/server', () => ({
  auth: { api: { getSession } },
}))

import { resolveAuthActor } from '@auth/middleware'

const headers = new Headers()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('resolveAuthActor', () => {
  it('returns the user and session on success', async () => {
    getSession.mockResolvedValue({ user: { id: 1 }, session: { id: 's' } })

    await expect(resolveAuthActor(headers)).resolves.toEqual({
      user: { id: 1 },
      session: { id: 's' },
    })
  })

  it('returns nulls when there is no session data', async () => {
    getSession.mockResolvedValue(null)

    await expect(resolveAuthActor(headers)).resolves.toEqual({
      user: null,
      session: null,
    })
  })

  it('swallows errors and returns nulls', async () => {
    getSession.mockRejectedValue(new Error('boom'))

    await expect(resolveAuthActor(headers)).resolves.toEqual({
      user: null,
      session: null,
    })
  })
})
