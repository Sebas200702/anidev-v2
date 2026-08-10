/**
 * Tests for {@link userService.createUserProfile} and
 * {@link userService.updateUserProfile}.
 *
 * @module domains/user/__tests__/services/user-writes
 * @remarks
 * Verifies owner-only authorization (via `canEditUserProfile`), conflict on
 * duplicate create, not-found on patch of missing row, cache invalidation
 * after success, and the DB-to-API mapping round-trip on the happy paths.
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

const { invalidateMock, getByIdMock, createMock, updateMock, canEditMock } =
  vi.hoisted(() => ({
    invalidateMock: vi.fn(),
    getByIdMock: vi.fn(),
    createMock: vi.fn(),
    updateMock: vi.fn(),
    canEditMock: vi.fn(),
  }))

vi.mock('@user/repositories/user', () => ({
  userRepository: {
    getUserProfileById: getByIdMock,
    createProfile: createMock,
    updateProfile: updateMock,
  },
}))

vi.mock('@user/cache', () => ({
  userProfileCache: { invalidate: invalidateMock },
}))

vi.mock('@user/policies/user', () => ({
  userPolicies: {
    canEditUserProfile: canEditMock,
  },
}))

import { userService } from '@user/services/user'
import { ErrorCodes } from '@shared/errors/codes'

const sessionId = 'user-1'

const validInput = {
  body: { name: 'Ada', lastName: 'Lovelace', gender: 'female' as const },
  params: {},
  query: {},
}

const persistedRow = {
  id: sessionId,
  userId: sessionId,
  avatar: null,
  name: 'Ada',
  lastName: 'Lovelace',
  birthday: null,
  gender: 'female',
  favoriteAnimes: '',
  favoriteGenres: '',
  favoriteStudios: '',
  frequency: null,
  fanaticLevel: null,
  preferredFormat: null,
  watchedAnimes: '',
}

const reset = () => {
  invalidateMock.mockReset()
  getByIdMock.mockReset()
  createMock.mockReset()
  updateMock.mockReset()
  canEditMock.mockReset()
  canEditMock.mockReturnValue(true)
}

describe('userService.createUserProfile', () => {
  beforeEach(reset)

  it('throws USER_UNAUTHORIZED when policy denies edit', async () => {
    canEditMock.mockReturnValue(false)
    await expect(
      userService.createUserProfile({ userId: sessionId, input: validInput })
    ).rejects.toMatchObject({ code: ErrorCodes.USER_UNAUTHORIZED })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('throws USER_PROFILE_CONFLICT when the insert hits an existing profile', async () => {
    // Atomic insert reports the duplicate by returning no row.
    createMock.mockResolvedValueOnce(undefined)

    await expect(
      userService.createUserProfile({ userId: sessionId, input: validInput })
    ).rejects.toMatchObject({ code: ErrorCodes.USER_PROFILE_CONFLICT })
    expect(createMock).toHaveBeenCalledTimes(1)
    expect(invalidateMock).not.toHaveBeenCalled()
  })

  it('inserts, maps, invalidates the cache and returns the mapped profile', async () => {
    createMock.mockResolvedValueOnce(persistedRow)
    invalidateMock.mockResolvedValueOnce(undefined)

    const result = await userService.createUserProfile({
      userId: sessionId,
      input: validInput,
    })

    expect(createMock).toHaveBeenCalledTimes(1)
    expect(invalidateMock).toHaveBeenCalledWith(sessionId)
    expect(result.id).toBe(sessionId)
    expect(result.gender).toBe('female')
  })
})

describe('userService.updateUserProfile', () => {
  beforeEach(reset)

  it('throws USER_NOT_FOUND when no profile exists for the target', async () => {
    updateMock.mockResolvedValueOnce(undefined)
    await expect(
      userService.updateUserProfile({
        userId: sessionId,
        targetId: sessionId,
        input: {
          body: { name: 'Grace' },
          params: { userId: sessionId },
          query: {},
        },
      })
    ).rejects.toMatchObject({ code: ErrorCodes.USER_NOT_FOUND })
  })

  it('applies patch, invalidates cache and returns mapped profile', async () => {
    updateMock.mockResolvedValueOnce({ ...persistedRow, name: 'Grace' })
    invalidateMock.mockResolvedValueOnce(undefined)

    const result = await userService.updateUserProfile({
      userId: sessionId,
      targetId: sessionId,
      input: {
        body: { name: 'Grace' },
        params: { userId: sessionId },
        query: {},
      },
    })

    expect(updateMock).toHaveBeenCalledWith(sessionId, { name: 'Grace' })
    expect(invalidateMock).toHaveBeenCalledWith(sessionId)
    expect(result.name).toBe('Grace')
  })
})
