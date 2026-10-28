/**
 * Tests for the printed-media detail loading and the detail / full services.
 *
 * @module domains/manga/__tests__/services/manga-detail-services
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    APP_BASE_URL: 'http://localhost:4321',
  },
}))
vi.mock('@lib/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  withStaleCache: async (opts: { compute: () => Promise<unknown> }) => ({
    value: await opts.compute(),
    isStale: false,
  }),
}))
vi.mock('@lib/cache/config', () => ({ CacheTtl: { Stale: 1, Medium: 2 } }))

const repo = vi.hoisted(() => ({
  getManga: vi.fn(),
  getCharacters: vi.fn(),
  getVoiceActors: vi.fn(),
  empty: vi.fn(),
}))
vi.mock('@manga/repositories/manga-details', () => ({
  mangaDetailsRepository: {
    getManga: repo.getManga,
    getStaff: repo.empty,
    getPublishers: repo.empty,
    getRelated: repo.empty,
    getExternalLinks: repo.empty,
  },
}))
vi.mock('@manga/repositories/manga-taxonomy', () => ({
  mangaTaxonomyRepository: {
    getGenres: repo.empty,
    getThemes: repo.empty,
    getDemographics: repo.empty,
  },
}))
vi.mock('@manga/repositories/manga-cast', () => ({
  mangaCastRepository: {
    getCharacters: repo.getCharacters,
    getVoiceActors: repo.getVoiceActors,
  },
}))
vi.mock('@manga/repositories/manga-titles', () => ({
  mangaTitlesRepository: { getSynonyms: repo.empty },
}))

const { loadMangaDetailRows } = await import(
  '@manga/services/manga-detail-rows'
)
const { mangaDetailsService } = await import('@manga/services/manga-detail')
const { mangaFullService } = await import('@manga/services/manga-full')

const work = { malId: 2, title: 'Berserk', type: 'manga' }

describe('loadMangaDetailRows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    repo.empty.mockResolvedValue([])
    repo.getVoiceActors.mockResolvedValue([])
  })

  it('throws MANGA_NOT_FOUND when the work is missing', async () => {
    repo.getManga.mockResolvedValue(null)
    await expect(loadMangaDetailRows(9)).rejects.toMatchObject({
      code: 'MANGA_NOT_FOUND',
    })
  })

  it('loads the voices of the cast characters', async () => {
    repo.getManga.mockResolvedValue(work)
    repo.getCharacters.mockResolvedValue([
      { characterId: 7, name: 'Guts', role: 'Main' },
    ])
    const rows = await loadMangaDetailRows(2)
    expect(repo.getVoiceActors).toHaveBeenCalledWith([7])
    expect(rows.work).toBe(work)
    expect(rows.synonyms).toEqual([])
  })
})

describe('mangaDetailsService / mangaFullService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    repo.empty.mockResolvedValue([])
    repo.getManga.mockResolvedValue(work)
    repo.getCharacters.mockResolvedValue([
      { characterId: 7, name: 'Guts', role: 'Main' },
    ])
    repo.getVoiceActors.mockResolvedValue([
      { characterId: 7, staffId: 9, name: 'Iwanaga', language: 'Japanese' },
    ])
  })

  it('maps the detail with voice actors', async () => {
    const { value } = await mangaDetailsService.getMangaDetails(2)
    expect(value.characters[0].voiceActors).toMatchObject([
      { staffId: 9, name: 'Iwanaga', language: 'Japanese' },
    ])
  })

  it('maps the extended payload with titles', async () => {
    const { value } = await mangaFullService.getMangaFullByMalId(2)
    expect(value.titles).toEqual([{ title: 'Berserk', type: 'main' }])
    expect(value.relations).toEqual([])
  })
})
