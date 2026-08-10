/**
 * Tests for `PATCH /api/user/:userId` profile update route.
 *
 * @module pages/api/user/__tests__/update-user
 * @remarks
 * Covers session gating, ownership vs path mismatch, validation, success
 * envelope, and not-found mapping through `mapErrorToHttp`.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    APP_BASE_URL: 'http://localhost:4321',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
    SENTRY_DSN: undefined,
    LOG_LEVEL: 'silent',
  },
}))

const { updateMock, invalidateMock } = vi.hoisted(() => ({
  updateMock: vi.fn(),
  invalidateMock: vi.fn(),
}))

vi.mock('@user/services/user', () => ({
  userService: {
    updateUserProfile: updateMock,
  },
}))

vi.mock('@user/cache', () => ({
  userProfileCache: { invalidate: invalidateMock },
}))

import { PATCH } from '../[userId]'

const sessionUser = { id: 'session-1' }

const buildContext = (
  targetId: string,
  overrides: Partial<{ user: unknown; body: unknown }> = {}
) =>
  ({
    request: new Request(`http://localhost:4321/api/user/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: overrides.body !== undefined ? JSON.stringify(overrides.body) : '',
    }),
    params: { userId: targetId },
    locals: {
      user: overrides.user === undefined ? sessionUser : overrides.user,
    },
  }) as unknown as Parameters<typeof PATCH>[0]

const callPatch = (context: Parameters<typeof PATCH>[0]) =>
  (PATCH as unknown as (ctx: typeof context) => Response | Promise<Response>)(
    context
  )

describe('PATCH /api/user/:userId', () => {
  beforeEach(() => {
    updateMock.mockReset()
    invalidateMock.mockReset()
  })

  it('rejects unauthenticated requests with 401', async () => {
    const response = await callPatch(
      buildContext('session-1', {
        user: null,
        body: { name: 'Grace' },
      })
    )
    expect(response.status).toBe(401)
  })

  it('rejects an empty patch body with 400', async () => {
    const response = await callPatch(buildContext('session-1', { body: {} }))
    expect(response.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('rejects cross-user patches with 403', async () => {
    const response = await callPatch(
      buildContext('someone-else', { body: { name: 'X' } })
    )
    expect(response.status).toBe(403)
  })

  it('returns 200 envelope on success', async () => {
    updateMock.mockResolvedValueOnce({
      id: 'session-1',
      avatar: '/placeholder.webp',
      name: 'Grace',
      lastName: 'Hopper',
      gender: 'female',
    })

    const response = await callPatch(
      buildContext('session-1', { body: { name: 'Grace' } })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.status).toBe(200)
    expect(body.data.name).toBe('Grace')
  })

  it('returns 404 when the target profile is missing', async () => {
    const { UserNotFoundError } = await import('@user/errors')
    const { ErrorCodes } = await import('@shared/errors/codes')
    updateMock.mockRejectedValueOnce(new UserNotFoundError('session-1'))

    const response = await callPatch(
      buildContext('session-1', { body: { name: 'X' } })
    )

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.code).toBe(ErrorCodes.USER_NOT_FOUND)
  })

  it('returns 500 RESPONSE_VALIDATION_ERROR when service returns invalid profile data', async () => {
    const { ErrorCodes } = await import('@shared/errors/codes')
    // Mock service returning data that fails userProfileSchema validation
    updateMock.mockResolvedValueOnce({
      id: 'session-1',
      avatar: '/placeholder.webp',
      // Missing required 'lastName' field
      name: 'Grace',
      gender: 'female',
    })

    const response = await callPatch(
      buildContext('session-1', { body: { name: 'Grace' } })
    )

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.data).toBeNull()
    expect(body.code).toBe(ErrorCodes.RESPONSE_VALIDATION_ERROR)
  })
})
