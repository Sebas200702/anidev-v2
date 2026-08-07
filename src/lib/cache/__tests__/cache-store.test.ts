/**
 * Tests for {@link withCache} read-through degradation.
 *
 * @module lib/cache/__tests__/cache-store
 * @remarks
 * Verifies that when the cache backend degrades, `cacheGet` resolves `null`
 * instead of throwing, so `withCache` falls straight through to `compute`
 * (the database) and never surfaces a cache failure to the caller.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock, setMock, delMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setMock: vi.fn(),
  delMock: vi.fn(),
}))

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

vi.mock('@lib/cache/client', () => ({
  redis: {
    get: getMock,
    set: setMock,
    del: delMock,
  },
}))

import { cacheDel, cacheGet, cacheSet } from '@lib/cache/cache-primitives'
import { withCache } from '@lib/cache/cache-store'
import { CacheTtl } from '@lib/cache/config'

describe('cache-primitives with a healthy ioredis client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('round-trips a JSON value through get/set', async () => {
    setMock.mockResolvedValueOnce('OK')
    getMock.mockResolvedValueOnce('{"malId":5114,"title":"Cowboy Bebop"}')

    await cacheSet(
      'anime:details:5114',
      { malId: 5114, title: 'Cowboy Bebop' },
      {
        ttlSeconds: CacheTtl.Medium,
      }
    )
    const got = await cacheGet<{ malId: number; title: string }>(
      'anime:details:5114'
    )

    expect(got).toEqual({ malId: 5114, title: 'Cowboy Bebop' })
    expect(setMock).toHaveBeenCalledWith(
      'anime:details:5114',
      '{"malId":5114,"title":"Cowboy Bebop"}',
      'EX',
      CacheTtl.Medium
    )
  })

  it('writes every entry with the required EX TTL', async () => {
    await cacheSet('k', 1, { ttlSeconds: CacheTtl.Short })

    expect(setMock).toHaveBeenCalledWith('k', '1', 'EX', CacheTtl.Short)
  })

  it('treats a missing key as a miss (null)', async () => {
    getMock.mockResolvedValueOnce(null)

    await expect(cacheGet('missing')).resolves.toBeNull()
  })

  it('deletes a key via redis.del', async () => {
    delMock.mockResolvedValueOnce(1)

    await cacheDel('anime:full:5114')

    expect(delMock).toHaveBeenCalledWith('anime:full:5114')
  })
})

describe('withCache graceful degradation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('falls through to compute when cacheGet returns null on a degraded backend', async () => {
    getMock.mockRejectedValueOnce(new Error('connection refused'))

    const compute = vi.fn(async () => ({ malId: 5114, title: 'Cowboy Bebop' }))

    const result = await withCache({
      key: 'anime:details:5114',
      getCache: cacheGet,
      setCache: (key, value) =>
        cacheSet(key, value, { ttlSeconds: CacheTtl.Medium }),
      compute,
    })

    expect(result).toEqual({ malId: 5114, title: 'Cowboy Bebop' })
    expect(compute).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledWith('anime:details:5114')
  })

  it('does not throw when the cache read fails', async () => {
    getMock.mockRejectedValueOnce(new Error('down'))

    await expect(cacheGet('anime:list:page:1')).resolves.toBeNull()
  })

  it('skips the write (no throw) when the cache store fails', async () => {
    setMock.mockRejectedValueOnce(new Error('down'))

    await expect(
      cacheSet('key', { ok: true }, { ttlSeconds: CacheTtl.Medium })
    ).resolves.toBeUndefined()
  })

  it('propagates compute errors (DB failures remain visible)', async () => {
    getMock.mockResolvedValueOnce(null)
    const compute = vi.fn(async () => {
      throw new Error('db unavailable')
    })

    await expect(
      withCache({
        key: 'k',
        getCache: cacheGet,
        setCache: (key, value) =>
          cacheSet(key, value, { ttlSeconds: CacheTtl.Medium }),
        compute,
      })
    ).rejects.toThrow('db unavailable')
  })
})
