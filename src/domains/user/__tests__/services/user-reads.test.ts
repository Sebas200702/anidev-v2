/**
 * Tests for the read path of {@link userService.getUserProfile}.
 *
 * @module domains/user/__tests__/services/user-reads
 * @remarks
 * `withCache` is mocked to run `getCache` then `compute` then `setCache`. Covers the public-view
 * happy path, the not-found error, and the mapping call. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserNotFoundError } from '@user/errors'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))
vi.mock('@lib/cache', () => ({
  withCache: async (opts: {
    key: string
    getCache: () => Promise<unknown>
    setCache: (k: string, v: unknown) => Promise<unknown>
    compute: () => Promise<unknown>
  }) => {
    await opts.getCache()
    const value = await opts.compute()
    await opts.setCache(opts.key, value)
    return value
  },
}))
vi.mock('@user/cache', () => ({
  userProfileCache: { key: () => 'k', get: vi.fn(), set: vi.fn() },
}))

const { getUserProfileById, mapUserProfile } = vi.hoisted(() => ({
  getUserProfileById: vi.fn(),
  mapUserProfile: vi.fn(),
}))
vi.mock('@user/repositories/user', () => ({
  userRepository: { getUserProfileById },
}))
vi.mock('@user/mappers/user', () => ({ mapUserProfile }))

import { userService } from '@user/services/user'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('userService.getUserProfile', () => {
  it('loads, maps, and returns a public profile', async () => {
    getUserProfileById.mockResolvedValue({ id: 'bob' })
    mapUserProfile.mockReturnValue({ id: 'bob', name: 'Bob' })

    const result = await userService.getUserProfile({
      userId: 'alice',
      targetId: 'bob',
    })

    expect(getUserProfileById).toHaveBeenCalledWith('bob')
    expect(mapUserProfile).toHaveBeenCalledWith({ userProfile: { id: 'bob' } })
    expect(result).toEqual({ id: 'bob', name: 'Bob' })
  })

  it('throws UserNotFoundError when the profile is missing', async () => {
    getUserProfileById.mockResolvedValue(undefined)

    await expect(
      userService.getUserProfile({ userId: 'alice', targetId: 'bob' })
    ).rejects.toBeInstanceOf(UserNotFoundError)
  })
})
