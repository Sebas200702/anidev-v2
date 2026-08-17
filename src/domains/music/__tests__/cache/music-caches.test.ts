/**
 * Tests for the music detail and music list caches.
 *
 * @module domains/music/__tests__/cache/music-caches
 * @remarks
 * Covers key format (id-based and filter-JSON-based) and delegation of `get`/`set` to the shared
 * cache client. `@lib/cache` is mocked. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MusicListFilters } from '@music/types'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', REDIS_URL: 'redis://localhost:6379' },
}))

const { cacheGet, cacheSet } = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))
vi.mock('@lib/cache', () => ({ cacheGet, cacheSet }))

const { musicCache } = await import('@music/cache/music')
const { musicListCache } = await import('@music/cache/music-list')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('musicCache', () => {
  it('builds an id-based key and delegates get/set', async () => {
    const key = musicCache.key(42)
    expect(key).toContain('42')

    await musicCache.get(42)
    expect(cacheGet).toHaveBeenCalledWith(key)

    await musicCache.set(42, { title: 'X' } as never)
    expect(cacheSet).toHaveBeenCalledWith(
      key,
      { title: 'X' },
      expect.objectContaining({ ttlSeconds: expect.any(Number) })
    )
  })
})

describe('musicListCache', () => {
  const filters: MusicListFilters = { page: 1, limit: 10 } as MusicListFilters

  it('encodes filters into the key deterministically', () => {
    expect(musicListCache.key(filters)).toBe(musicListCache.key(filters))
    expect(musicListCache.key(filters)).toContain(JSON.stringify(filters))
  })

  it('delegates get/set with the filter key', async () => {
    const key = musicListCache.key(filters)
    await musicListCache.get(filters)
    expect(cacheGet).toHaveBeenCalledWith(key)

    await musicListCache.set(filters, { list: [], total: 0 } as never)
    expect(cacheSet).toHaveBeenCalledWith(
      key,
      { list: [], total: 0 },
      expect.objectContaining({ ttlSeconds: expect.any(Number) })
    )
  })
})
