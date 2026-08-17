/**
 * Tests for the {@link userProfileCache} key and read/write delegation.
 *
 * @module domains/user/__tests__/cache/user-profile-cache-reads
 * @remarks
 * Covers the key format and delegation of `get`/`set` to the shared cache client. `@lib/cache` is
 * mocked. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', REDIS_URL: 'redis://localhost:6379' },
}))

const { cacheGet, cacheSet, cacheDel } = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDel: vi.fn(),
}))
vi.mock('@lib/cache', () => ({ cacheGet, cacheSet, cacheDel }))

const { userProfileCache } = await import('@user/cache')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('userProfileCache', () => {
  it('builds a user-scoped key', () => {
    expect(userProfileCache.key('bob')).toContain('bob')
  })

  it('delegates get and set to the client', async () => {
    const key = userProfileCache.key('bob')
    await userProfileCache.get('bob')
    expect(cacheGet).toHaveBeenCalledWith(key)

    await userProfileCache.set('bob', { id: 'bob' } as never)
    expect(cacheSet).toHaveBeenCalledWith(
      key,
      { id: 'bob' },
      expect.objectContaining({ ttlSeconds: expect.any(Number) })
    )
  })
})
