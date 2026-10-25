/**
 * Route tests for `PATCH /api/user/:userId/preferences`.
 *
 * @module pages/api/user/__tests__/update-preferences
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

const { updatePreferences } = vi.hoisted(() => ({
  updatePreferences: vi.fn(),
}))
vi.mock('@user/services/user-preferences', () => ({
  userPreferencesService: { updatePreferences },
}))

const { PATCH } = await import('../[userId]/preferences')
const { ValidationError } = await import('@shared/errors/validation-error')

const profile = {
  id: 'u1',
  name: 'Ada',
  lastName: 'Lovelace',
  gender: 'female',
  preferences: { fanaticLevel: 'high', favoriteGenres: [1, 4] },
}

const call = (targetId: string, body: unknown, user: unknown = { id: 'u1' }) =>
  PATCH({
    request: new Request(
      `http://localhost:4321/api/user/${targetId}/preferences`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    ),
    params: { userId: targetId },
    locals: { user },
  } as never)

beforeEach(() => {
  vi.clearAllMocks()
  updatePreferences.mockResolvedValue(profile)
})

describe('PATCH /api/user/:userId/preferences', () => {
  it('updates the owner preferences without caching', async () => {
    const res = await call('u1', {
      fanaticLevel: 'high',
      favoriteGenres: [1, 4, 4],
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(updatePreferences).toHaveBeenCalledWith({
      userId: 'u1',
      targetId: 'u1',
      input: { fanaticLevel: 'high', favoriteGenres: [1, 4] },
    })
  })

  it('requires a session', async () => {
    expect((await call('u1', { frequency: 'daily' }, null)).status).toBe(401)
  })

  it('forbids another user', async () => {
    expect((await call('u2', { frequency: 'daily' })).status).toBe(403)
    expect(updatePreferences).not.toHaveBeenCalled()
  })

  it.each([{}, { fanaticLevel: 'extreme' }])(
    'rejects body %o',
    async (body) => {
      expect((await call('u1', body)).status).toBe(400)
    }
  )

  it('surfaces unknown catalog ids as 400', async () => {
    updatePreferences.mockRejectedValue(
      new ValidationError('VALIDATION_ERROR', 'Unknown catalog ids', {
        unknownIds: { genres: [], studios: [999], animes: [] },
      })
    )
    expect((await call('u1', { favoriteStudios: [999] })).status).toBe(400)
  })
})
