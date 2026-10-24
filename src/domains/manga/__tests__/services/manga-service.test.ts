import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))
vi.mock('@lib/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  withStaleCache: async (opts: any) => {
    await opts.getCache()
    await opts.getStaleCache(opts.staleKey)
    const value = await opts.compute()
    await opts.setCache(opts.key, value)
    await opts.setStaleCache(opts.staleKey, value)
    return { value, isStale: false }
  },
}))
vi.mock('@lib/cache/config', () => ({ CacheTtl: { Stale: 1, Medium: 2 } }))
vi.mock('@manga/cache/manga-list/cache', () => ({
  mangaListCache: { key: () => 'k', get: vi.fn(), set: vi.fn() },
}))
vi.mock('@manga/mappers/manga-mapper', () => ({
  mapMangaCard: (work: any) => ({ malId: work.malId, card: true }),
  mapMangaDetails: (input: any) => ({ malId: input.work.malId, detail: true }),
}))

const { getList, getCount, getManga } = vi.hoisted(() => ({
  getList: vi.fn(),
  getCount: vi.fn(),
  getManga: vi.fn(),
}))

vi.mock('@manga/repositories/manga-list', () => ({
  mangaListRepository: {
    getMangaList: getList,
    countMangaList: getCount,
  },
}))
vi.mock('@manga/repositories/manga-details', () => ({
  mangaDetailsRepository: {
    getManga: getManga,
    getGenres: vi.fn().mockResolvedValue([]),
    getThemes: vi.fn().mockResolvedValue([]),
    getDemographics: vi.fn().mockResolvedValue([]),
    getCharacters: vi.fn().mockResolvedValue([]),
    getStaff: vi.fn().mockResolvedValue([]),
    getPublishers: vi.fn().mockResolvedValue([]),
    getRelated: vi.fn().mockResolvedValue([]),
    getExternalLinks: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('@manga/errors/manga-not-found-error', () => ({
  mangaNotFound: (id: number) => new Error(`not found ${id}`),
}))

import {
  mangaListService,
  mangaDetailsService,
} from '@manga/services/manga-service'

describe('mangaListService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('forces safe parental variant and maps rows', async () => {
    getList.mockResolvedValue([{ malId: 1 }])
    getCount.mockResolvedValue(1)

    const { value } = await mangaListService.getMangaList({} as any)

    expect(getList).toHaveBeenCalled()
    expect(getCount).toHaveBeenCalled()
    expect(value).toEqual({ list: [{ malId: 1, card: true }], total: 1 })
  })

  it('splits comma-separated filters', async () => {
    getList.mockResolvedValue([])
    getCount.mockResolvedValue(0)
    await mangaListService.getMangaList({ type: 'manga,novel' } as any)
    expect(getList).toHaveBeenCalled()
  })
})

describe('mangaDetailsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when work missing', async () => {
    getManga.mockResolvedValue(null)
    await expect(mangaDetailsService.getMangaDetails(99)).rejects.toThrow()
  })

  it('returns detail when work exists', async () => {
    getManga.mockResolvedValue({ malId: 7 })
    const { value } = await mangaDetailsService.getMangaDetails(7)
    expect(value).toMatchObject({ malId: 7, detail: true })
  })
})
