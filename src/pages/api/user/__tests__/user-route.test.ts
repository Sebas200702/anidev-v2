/**
 * Route tests for `/api/user/[userId]` (GET + PATCH).
 *
 * @module pages/api/user/__tests__/user-route
 * @remarks
 * Drives the real validation + error-handling wrappers with a mocked service and permissive response
 * schema. Covers the anonymous GET, the authenticated PATCH, and the cross-user forbidden branch.
 * Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    APP_BASE_URL: 'http://localhost:4321',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
    LOG_LEVEL: 'silent',
  },
}))

const { getUserProfile, updateUserProfile, requireAuthSession } = vi.hoisted(
  () => ({
    getUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    requireAuthSession: vi.fn(),
  })
)
vi.mock('@user/services/user', () => ({
  userService: { getUserProfile, updateUserProfile },
}))
vi.mock('@auth/utils', () => ({ requireAuthSession }))
vi.mock('@user/schemas', async (orig) => ({
  ...(await orig<typeof import('@user/schemas')>()),
  userProfileResponseSchema: z.any(),
}))

const { GET, PATCH } = await import('../[userId]')

type RouteFn = (ctx: unknown) => Promise<Response>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/user/[userId]', () => {
  it('returns a profile for an anonymous caller', async () => {
    getUserProfile.mockResolvedValue({ id: 'bob', name: 'Bob' })

    const res = await (GET as RouteFn)({
      request: new Request('http://localhost:4321/api/user/bob'),
      params: { userId: 'bob' },
      locals: {},
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual({ id: 'bob', name: 'Bob' })
    expect(getUserProfile).toHaveBeenCalledWith({
      userId: 'anonymous',
      targetId: 'bob',
    })
  })
})

describe('PATCH /api/user/[userId]', () => {
  const patch = (userId: string, locals: Record<string, unknown>) =>
    (PATCH as RouteFn)({
      request: new Request(`http://localhost:4321/api/user/${userId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'New' }),
      }),
      params: { userId },
      locals,
    })

  it('updates the profile for the owner', async () => {
    requireAuthSession.mockReturnValue('bob')
    updateUserProfile.mockResolvedValue({ id: 'bob', name: 'New' })

    const res = await patch('bob', { user: { id: 'bob' } })

    expect(res.status).toBe(200)
    expect(updateUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'bob', targetId: 'bob' })
    )
  })

  it('returns 403 when editing another user', async () => {
    requireAuthSession.mockReturnValue('bob')

    const res = await patch('alice', { user: { id: 'bob' } })

    expect(res.status).toBe(403)
    expect(updateUserProfile).not.toHaveBeenCalled()
  })
})
