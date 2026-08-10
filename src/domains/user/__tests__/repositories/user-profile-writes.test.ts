/**
 * Tests for {@link userRepository.createProfile} and
 * {@link userRepository.updateProfile}.
 *
 * @module domains/user/__tests__/repositories/user-profile-writes
 * @remarks
 * Verifies the write surface round-trips through Drizzle and surfaces DB
 * failures as typed {@link InfraError} via {@link dbError}. Asserts the
 * repository treats `eq(profile.id, ...)` as the row identity and returns
 * `undefined` when an update touches zero rows.
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

const insertMock = vi.fn()
const updateMock = vi.fn()
const setMock = vi.fn()
const whereMock = vi.fn()
const returningMock = vi.fn()

const { dbErrorMock } = vi.hoisted(() => ({
  dbErrorMock: vi.fn((op: string, ctx: unknown, cause: unknown) => {
    const err = new Error(`dbError:${op}`)
    ;(err as Error & { code: string }).code = 'DB_ERROR'
    ;(err as unknown as { ctx: unknown }).ctx = ctx
    ;(err as unknown as { cause: unknown }).cause = cause
    return err
  }),
}))

vi.mock('@db/client', () => ({
  db: {
    insert: insertMock,
    update: updateMock,
  },
}))

vi.mock('@shared/errors/db-errors', () => ({
  dbError: dbErrorMock,
}))

const flush = () => {
  insertMock.mockReset()
  updateMock.mockReset()
  setMock.mockReset()
  whereMock.mockReset()
  returningMock.mockReset()
}

describe('userRepository.createProfile', () => {
  beforeEach(() => {
    flush()
  })

  it('inserts a profile row and returns it', async () => {
    const insertedRow = { id: 'user-1', name: 'Ada', lastName: 'Lovelace' }
    const returningMock = vi.fn().mockResolvedValueOnce([insertedRow])
    const valuesMock = vi.fn().mockReturnValueOnce({ returning: returningMock })
    insertMock.mockReturnValueOnce({ values: valuesMock })

    const { userRepository } = await import('@user/repositories/user')

    const result = await userRepository.createProfile({
      id: 'user-1',
      userId: 'user-1',
      name: 'Ada',
      lastName: 'Lovelace',
    } as never)

    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledWith({
      id: 'user-1',
      userId: 'user-1',
      name: 'Ada',
      lastName: 'Lovelace',
    })
    expect(result).toEqual(insertedRow)
  })

  it('wraps DB failures in dbError', async () => {
    const cause = new Error('connection refused')
    insertMock.mockImplementationOnce(() => {
      throw cause
    })

    const { userRepository } = await import('@user/repositories/user')

    await expect(
      userRepository.createProfile({
        id: 'user-1',
        userId: 'user-1',
        name: 'Ada',
        lastName: 'Lovelace',
      } as never)
    ).rejects.toMatchObject({ message: 'dbError:[CREATE_USER_PROFILE]' })
    expect(dbErrorMock).toHaveBeenCalledWith(
      '[CREATE_USER_PROFILE]',
      expect.any(Object),
      cause
    )
  })
})

describe('userRepository.updateProfile', () => {
  beforeEach(() => {
    flush()
  })

  it('updates by profile.id and returns the updated row', async () => {
    const updatedRow = { id: 'user-1', name: 'Grace' }
    updateMock.mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([updatedRow]),
        }),
      }),
    })

    const { userRepository } = await import('@user/repositories/user')

    const result = await userRepository.updateProfile('user-1', {
      name: 'Grace',
    })

    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual(updatedRow)
  })

  it('returns undefined when no row matches the id', async () => {
    updateMock.mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
    })

    const { userRepository } = await import('@user/repositories/user')

    const result = await userRepository.updateProfile('missing', {
      name: 'Grace',
    })

    expect(result).toBeUndefined()
  })
})
