/**
 * Tests for {@link animeListService}.
 *
 * @module domains/anime/__tests__/services/anime-list-service
 * @remarks
 * Exercises the compute pipeline in isolation ({@link withStaleCache} mocked to run `compute`).
 * Covers the fail-closed `parentalVariant: 'safe'` floor, repository fan-out, and card mapping.
 * Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))
vi.mock('@lib/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  withStaleCache: async (opts: {
    key: string
    staleKey: string
    getCache: () => Promise<unknown>
    getStaleCache: (k: string) => Promise<unknown>
    setCache: (k: string, v: unknown) => Promise<unknown>
    setStaleCache: (k: string, v: unknown) => Promise<unknown>
    compute: () => Promise<unknown>
  }) => {
    await opts.getCache()
    await opts.getStaleCache(opts.staleKey)
    const value = await opts.compute()
    await opts.setCache(opts.key, value)
    await opts.setStaleCache(opts.staleKey, value)
    return { value, isStale: false }
  },
}))
vi.mock('@lib/cache/config', () => ({ CacheTtl: { Stale: 1, Medium: 2 } }))
vi.mock('@anime/cache/anime-list', () => ({
  animeListCache: { key: () => 'k', get: vi.fn(), set: vi.fn() },
}))
vi.mock('@anime/mappers/anime-filters', () => ({
  mapAnimeFilters: (p: Record<string, unknown>) => ({ ...p, mapped: true }),
}))

const { getAnimeList, getAnimeListCount, mapCards } = vi.hoisted(() => ({
  getAnimeList: vi.fn(),
  getAnimeListCount: vi.fn(),
  mapCards: vi.fn(),
}))

vi.mock('@anime/repositories/anime-list', () => ({
  animeListRepository: {
    getAnimeList,
    getAnimeListCount,
  },
}))
vi.mock('@anime/mappers/anime-card', () => ({
  mapAnimeListToCards: mapCards,
}))

import { animeListService } from '@anime/services/anime-list'

describe('animeListService.getAnimeList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('forces the safe parental variant and maps rows to cards', async () => {
    getAnimeList.mockResolvedValue([{ malId: 1 }])
    getAnimeListCount.mockResolvedValue(1)
    mapCards.mockReturnValue(['card'])

    const { value } = await animeListService.getAnimeList({
      page: '1',
    } as never)

    expect(getAnimeList).toHaveBeenCalledWith(
      expect.objectContaining({ parentalVariant: 'safe', mapped: true })
    )
    expect(mapCards).toHaveBeenCalledWith({ animeList: [{ malId: 1 }] })
    expect(value).toEqual({ list: ['card'], total: 1 })
  })
})
