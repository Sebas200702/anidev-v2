/**
 * Tests for {@link animeCarouselService.getCarouselItems}.
 *
 * @module domains/anime/__tests__/services/anime-carousel-service
 * @remarks
 * `withCache` is mocked to run through; the cache, eligibility repository,
 * batched fan-outs, and mapper are mocked. Proves the empty-eligibility
 * short-circuit (no fan-out queries) and per-anime grouping of the two
 * batched fan-outs (3 cold queries total). Follows the repo TDD/unit-test
 * layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

const { cacheGet, cacheSet, cacheKey } = vi.hoisted(() => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn(),
  cacheKey: vi.fn(() => 'anime:carousel:slides'),
}))
vi.mock('@anime/cache/anime-carousel', () => ({
  animeCarouselCache: { key: cacheKey, get: cacheGet, set: cacheSet },
}))

const { getTopPopularWithMedia, getGenresByAnimeIds } = vi.hoisted(() => ({
  getTopPopularWithMedia: vi.fn(),
  getGenresByAnimeIds: vi.fn(),
}))
vi.mock('@anime/repositories/anime-carousel', () => ({
  animeCarouselRepository: { getTopPopularWithMedia },
}))
vi.mock('@anime/repositories/anime-taxonomy', () => ({
  animeTaxonomyRepository: { getGenresByAnimeIds },
}))

const { getAnimeMediaByIds } = vi.hoisted(() => ({
  getAnimeMediaByIds: vi.fn(),
}))
vi.mock('@media/services/get-anime-media', () => ({ getAnimeMediaByIds }))

const { mapCarouselItem } = vi.hoisted(() => ({ mapCarouselItem: vi.fn() }))
vi.mock('@anime/mappers/anime-carousel', () => ({ mapCarouselItem }))

import { animeCarouselService } from '@anime/services/anime-carousel'

const animeA = { malId: 1, title: 'A' }
const animeB = { malId: 2, title: 'B' }

beforeEach(() => {
  vi.clearAllMocks()
  cacheKey.mockReturnValue('anime:carousel:slides')
  mapCarouselItem.mockImplementation(({ anime }) => ({ anime }))
})

describe('animeCarouselService.getCarouselItems', () => {
  it('short-circuits fan-outs when nothing is eligible', async () => {
    getTopPopularWithMedia.mockResolvedValue([])

    const result = await animeCarouselService.getCarouselItems()

    expect(result).toEqual([])
    expect(getAnimeMediaByIds).not.toHaveBeenCalled()
    expect(getGenresByAnimeIds).not.toHaveBeenCalled()
    expect(mapCarouselItem).not.toHaveBeenCalled()
  })

  it('fans out twice and groups rows per anime', async () => {
    getTopPopularWithMedia.mockResolvedValue([animeA, animeB])
    getAnimeMediaByIds.mockResolvedValue({
      1: [{ id: 10, mediaType: 'banner', src: 'b', size: null }],
    })
    getGenresByAnimeIds.mockResolvedValue([
      { malId: 20, name: 'Action', animeId: 2 },
      { malId: 10, name: 'Drama', animeId: 1 },
    ])

    await animeCarouselService.getCarouselItems()

    expect(getAnimeMediaByIds).toHaveBeenCalledTimes(1)
    expect(getAnimeMediaByIds).toHaveBeenCalledWith([1, 2])
    expect(getGenresByAnimeIds).toHaveBeenCalledTimes(1)
    expect(mapCarouselItem).toHaveBeenCalledWith({
      anime: animeA,
      media: [{ id: 10, mediaType: 'banner', src: 'b', size: null }],
      genres: [{ malId: 10, name: 'Drama' }],
    })
    expect(mapCarouselItem).toHaveBeenCalledWith({
      anime: animeB,
      media: [],
      genres: [{ malId: 20, name: 'Action' }],
    })
  })

  it('reads through the dedicated carousel cache prefix', async () => {
    getTopPopularWithMedia.mockResolvedValue([])

    await animeCarouselService.getCarouselItems()

    expect(cacheKey).toHaveBeenCalled()
    expect(cacheGet).toHaveBeenCalled()
  })
})
