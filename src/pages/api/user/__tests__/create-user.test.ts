/**
 * Tests for `POST /api/user` profile creation route.
 *
 * @module pages/api/user/__tests__/create-user
 * @remarks
 * Covers session gating, validation, success envelope, and conflict mapping
 * through the standard `mapErrorToHttp` pipeline.
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

const { createMock, invalidateMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  invalidateMock: vi.fn(),
}))

vi.mock('@user/services/user', () => ({
  userService: {
    createUserProfile: createMock,
  },
}))

vi.mock('@user/cache', () => ({
  userProfileCache: { invalidate: invalidateMock },
}))

import { POST } from '../index'

const sessionUser = { id: 'session-1' }

const buildContext = (
  overrides: Partial<{ user: unknown; body: unknown }> = {}
) =>
  ({
    request: new Request('http://localhost:4321/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: overrides.body !== undefined ? JSON.stringify(overrides.body) : '',
    }),
    locals: {
      user: overrides.user === undefined ? sessionUser : overrides.user,
    },
  }) as unknown as Parameters<typeof POST>[0]

// `POST` is typed for Astro (`(context) => Response`); in tests we invoke it
// directly with a single context argument.
const callPost = (context: Parameters<typeof POST>[0]) =>
  (POST as unknown as (ctx: typeof context) => Response | Promise<Response>)(
    context
  )

describe('POST /api/user', () => {
  beforeEach(() => {
    createMock.mockReset()
    invalidateMock.mockReset()
  })

  it('rejects unauthenticated requests with 401', async () => {
    const response = await callPost(
      buildContext({
        user: null,
        body: { name: 'Ada', lastName: 'Lovelace', gender: 'female' },
      })
    )
    expect(response.status).toBe(401)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rejects invalid bodies with 400', async () => {
    const response = await callPost(buildContext({ body: { name: 'Ada' } }))
    expect(response.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('creates a profile and returns 201 envelope on success', async () => {
    createMock.mockResolvedValueOnce({
      id: 'session-1',
      avatar: '/placeholder.webp',
      name: 'Ada',
      lastName: 'Lovelace',
      gender: 'female',
    })

    const response = await callPost(
      buildContext({
        body: {
          name: 'Ada',
          lastName: 'Lovelace',
          gender: 'female',
        },
      })
    )

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.status).toBe(201)
    expect(body.data.id).toBe('session-1')
  })

  it('returns 409 when the user already has a profile', async () => {
    const { UserProfileConflictError } = await import('@user/errors')
    const { ErrorCodes } = await import('@shared/errors/codes')
    createMock.mockRejectedValueOnce(new UserProfileConflictError('session-1'))

    const response = await callPost(
      buildContext({
        body: {
          name: 'Ada',
          lastName: 'Lovelace',
          gender: 'female',
        },
      })
    )

    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.code).toBe(ErrorCodes.USER_PROFILE_CONFLICT)
    expect(response.headers.get('content-type')).toContain('application/json')
  })
})
