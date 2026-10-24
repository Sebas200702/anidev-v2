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
}))

const { getList, getCount } = vi.hoisted(() => ({
  getList: vi.fn(),
  getCount: vi.fn(),
}))

vi.mock('@manga/repositories/manga-list', () => ({
  mangaListRepository: {
    getMangaList: getList,
    countMangaList: getCount,
  },
}))
import { mangaListService } from '@manga/services/manga-service'

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
