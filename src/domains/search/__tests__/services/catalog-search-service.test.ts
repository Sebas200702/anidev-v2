/**
 * Tests for {@link catalogSearchService}.
 *
 * @module domains/search/__tests__/services/catalog-search-service
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

const { getAnimeList, getMangaList } = vi.hoisted(() => ({
  getAnimeList: vi.fn(),
  getMangaList: vi.fn(),
}))
vi.mock('@anime/services/anime-list', () => ({
  animeListService: { getAnimeList },
}))
vi.mock('@manga/services/manga-service', () => ({
  mangaListService: { getMangaList },
}))

const { catalogSearchService } = await import('@search/services/catalog-search')

describe('catalogSearchService.search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const page = { value: { list: [], total: 0 }, isStale: false }
    getAnimeList.mockResolvedValue(page)
    getMangaList.mockResolvedValue(page)
  })

  it('searches manga by query', async () => {
    const { value } = await catalogSearchService.search({
      q: 'berserk',
      type: 'manga',
      page: 1,
      limit: 10,
    })
    expect(getMangaList).toHaveBeenCalledWith({
      query: 'berserk',
      page: 1,
      limit: 10,
    })
    expect(getAnimeList).not.toHaveBeenCalled()
    expect(value.type).toBe('manga')
  })

  it('searches anime ranked by relevance', async () => {
    const { value } = await catalogSearchService.search({
      q: 'bebop',
      type: 'anime',
      page: 2,
      limit: 5,
    })
    expect(getAnimeList).toHaveBeenCalledWith({
      query: 'bebop',
      sort: 'relevance',
      page: 2,
      limit: 5,
    })
    expect(value.type).toBe('anime')
  })
})
