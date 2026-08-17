/**
 * Tests for {@link musicListService}.
 *
 * @module domains/music/__tests__/services/music-list-service
 * @remarks
 * Exercises the compute pipeline in isolation: {@link withStaleCache} is mocked to run `compute`,
 * repositories and mappers are mocked. Covers the empty-list short-circuit and artist grouping by
 * music id. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    APP_BASE_URL: 'http://localhost',
  },
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
vi.mock('@music/cache/music-list', () => ({
  musicListCache: { key: () => 'k', get: vi.fn(), set: vi.fn() },
}))
vi.mock('@music/mappers/music-filters', () => ({
  mapMusicListFilters: (p: unknown) => p,
}))

const { getMusicList, getMusicListCount, findArtistsByMusicIds, mapCards } =
  vi.hoisted(() => ({
    getMusicList: vi.fn(),
    getMusicListCount: vi.fn(),
    findArtistsByMusicIds: vi.fn(),
    mapCards: vi.fn(),
  }))

vi.mock('@music/repositories/music-list', () => ({
  musicListRepository: {
    getMusicList: getMusicList,
    getMusicListCount: getMusicListCount,
  },
}))
vi.mock('@music/repositories/music-relation', () => ({
  musicRelationRepository: { findArtistsByMusicIds },
}))
vi.mock('@music/mappers/music-card', () => ({
  mapMusicListToCards: mapCards,
}))

import { musicListService } from '@music/services/music-list'

describe('musicListService.getMusicList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('short-circuits to an empty list without querying artists', async () => {
    getMusicList.mockResolvedValue([])
    getMusicListCount.mockResolvedValue(0)

    const { value } = await musicListService.getMusicList({
      page: 1,
      limit: 10,
    })

    expect(value).toEqual({ list: [], total: 0 })
    expect(findArtistsByMusicIds).not.toHaveBeenCalled()
    expect(mapCards).not.toHaveBeenCalled()
  })

  it('groups artists by music id before mapping', async () => {
    getMusicList.mockResolvedValue([{ id: 1 }, { id: 2 }])
    getMusicListCount.mockResolvedValue(2)
    findArtistsByMusicIds.mockResolvedValue([
      { musicId: 1, malId: 5, name: 'A' },
      { musicId: 1, malId: 6, name: 'B' },
      { musicId: 2, malId: 7, name: 'C' },
    ])
    mapCards.mockReturnValue(['card'])

    const { value } = await musicListService.getMusicList({
      page: 1,
      limit: 10,
    })

    expect(findArtistsByMusicIds).toHaveBeenCalledWith([1, 2])
    expect(mapCards).toHaveBeenCalledWith({
      musicList: [{ id: 1 }, { id: 2 }],
      artistsByMusicId: {
        1: [
          { malId: 5, name: 'A' },
          { malId: 6, name: 'B' },
        ],
        2: [{ malId: 7, name: 'C' }],
      },
    })
    expect(value).toEqual({ list: ['card'], total: 2 })
  })
})
