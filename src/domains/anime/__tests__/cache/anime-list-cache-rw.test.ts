/**
 * Tests for the anime list cache get/set delegation.
 *
 * @module domains/anime/__tests__/cache/anime-list-cache-rw
 * @remarks
 * Complements the key-isolation test by covering `get`/`set` delegation to the shared cache client.
 * `@lib/cache` is mocked. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnimeFilters } from '@anime/types'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', REDIS_URL: 'redis://localhost:6379' },
}))

const { cacheGet, cacheSet } = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))
vi.mock('@lib/cache', () => ({ cacheGet, cacheSet }))

const { animeListCache } = await import('@anime/cache/anime-list')

const filters = { page: 1, limit: 10, parentalVariant: 'safe' } as AnimeFilters

beforeEach(() => {
  vi.clearAllMocks()
})

describe('animeListCache get/set', () => {
  it('delegates get with the filter key', async () => {
    await animeListCache.get(filters)
    expect(cacheGet).toHaveBeenCalledWith(animeListCache.key(filters))
  })

  it('delegates set with the filter key and a TTL', async () => {
    await animeListCache.set(filters, { list: [], total: 0 } as never)
    expect(cacheSet).toHaveBeenCalledWith(
      animeListCache.key(filters),
      { list: [], total: 0 },
      expect.objectContaining({ ttlSeconds: expect.any(Number) })
    )
  })
})
