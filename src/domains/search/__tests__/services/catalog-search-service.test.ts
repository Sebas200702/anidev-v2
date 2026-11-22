/**
 * Tests for {@link catalogSearchService}.
 *
 * @module domains/search/__tests__/services/catalog-search-service
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

const { getAnimeList, getMangaList, getMusicList, searchCharacters } =
  vi.hoisted(() => ({
    getAnimeList: vi.fn(),
    getMangaList: vi.fn(),
    getMusicList: vi.fn(),
    searchCharacters: vi.fn(),
  }))
vi.mock('@anime/services/anime-list', () => ({
  animeListService: { getAnimeList },
}))
vi.mock('@manga/services/manga-service', () => ({
  mangaListService: { getMangaList },
}))
vi.mock('@music/services/music-list', () => ({
  musicListService: { getMusicList },
}))
vi.mock('@people/services/character', () => ({
  characterService: { search: searchCharacters },
}))

const { catalogSearchService } = await import('@search/services/catalog-search')

describe('catalogSearchService.search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const page = { value: { list: [], total: 0 }, isStale: false }
    getAnimeList.mockResolvedValue(page)
    getMangaList.mockResolvedValue(page)
    getMusicList.mockResolvedValue(page)
    searchCharacters.mockResolvedValue(page)
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

  it('searches music by title', async () => {
    const { value } = await catalogSearchService.search({
      q: 'tank',
      type: 'music',
      page: 1,
      limit: 10,
    })
    expect(getMusicList).toHaveBeenCalledWith({
      query: 'tank',
      page: 1,
      limit: 10,
    })
    expect(getAnimeList).not.toHaveBeenCalled()
    expect(value.type).toBe('music')
  })

  it('searches characters by name', async () => {
    const { value } = await catalogSearchService.search({
      q: 'spike',
      type: 'characters',
      page: 3,
      limit: 20,
    })
    expect(searchCharacters).toHaveBeenCalledWith({
      query: 'spike',
      page: 3,
      limit: 20,
    })
    expect(getAnimeList).not.toHaveBeenCalled()
    expect(value.type).toBe('characters')
  })
})
