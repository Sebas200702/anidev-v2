/**
 * Tests for {@link animeFullService}.
 *
 * @module domains/anime/__tests__/services/anime-full-service
 * @remarks
 * Exercises the compute pipeline in isolation ({@link withStaleCache} mocked to run `compute`).
 * Covers the not-found path, parallel fan-out into the full mapper, and propagation of the music
 * stale flag into the result. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AnimeNotFoundError } from '@anime/errors/anime-not-found-error'

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
vi.mock('@anime/cache/anime-full', () => ({
  animeFullCache: { key: () => 'k', get: vi.fn(), set: vi.fn() },
}))

const {
  getAnimeByMalId,
  getGenres,
  getThemes,
  getDemographics,
  getSynonyms,
  getRelations,
  getRelationData,
  getExternal,
  getAnimeMedia,
  getMusicByAnimeId,
  mapFull,
} = vi.hoisted(() => ({
  getAnimeByMalId: vi.fn(),
  getGenres: vi.fn(),
  getThemes: vi.fn(),
  getDemographics: vi.fn(),
  getSynonyms: vi.fn(),
  getRelations: vi.fn(),
  getRelationData: vi.fn(),
  getExternal: vi.fn(),
  getAnimeMedia: vi.fn(),
  getMusicByAnimeId: vi.fn(),
  mapFull: vi.fn(),
}))

vi.mock('@anime/repositories/anime', () => ({
  animeRepository: { getAnimeByMalId },
}))
vi.mock('@anime/repositories/anime-external', () => ({
  animeExternalRepository: { getExternalLinksByAnimeId: getExternal },
}))
vi.mock('@anime/repositories/anime-relations', () => ({
  animeRelationsRepository: {
    getRelatedAnimeByAnimeId: getRelations,
    getAnimeRelatedAnimeDataByAnimeId: getRelationData,
  },
}))
vi.mock('@anime/repositories/anime-taxonomy', () => ({
  animeTaxonomyRepository: {
    getGenresByAnimeId: getGenres,
    getThemesByAnimeId: getThemes,
    getDemographicsByAnimeId: getDemographics,
  },
}))
vi.mock('@anime/repositories/anime-title', () => ({
  animeTitleRepository: { getTitleSynonymsByAnimeId: getSynonyms },
}))
vi.mock('@media/services/get-anime-media', () => ({ getAnimeMedia }))
vi.mock('@music/services/anime-music', () => ({ getMusicByAnimeId }))
vi.mock('@anime/mappers/anime-full', () => ({ mapAnimeToFullDetails: mapFull }))

import { animeFullService } from '@anime/services/anime-full'

const primeRepos = () => {
  getGenres.mockResolvedValue([])
  getThemes.mockResolvedValue([])
  getDemographics.mockResolvedValue([])
  getSynonyms.mockResolvedValue([])
  getRelations.mockResolvedValue([])
  getRelationData.mockResolvedValue([])
  getExternal.mockResolvedValue({})
  getAnimeMedia.mockResolvedValue([])
}

describe('animeFullService.getAnimeFullByMalId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws AnimeNotFoundError when the core row is missing', async () => {
    getAnimeByMalId.mockResolvedValue(null)

    await expect(
      animeFullService.getAnimeFullByMalId(5114)
    ).rejects.toBeInstanceOf(AnimeNotFoundError)
  })

  it('maps the aggregated payload and keeps a fresh result fresh', async () => {
    getAnimeByMalId.mockResolvedValue({ malId: 5114 })
    primeRepos()
    getMusicByAnimeId.mockResolvedValue({ value: [], isStale: false })
    mapFull.mockReturnValue({ malId: 5114 })

    const result = await animeFullService.getAnimeFullByMalId(5114)

    expect(mapFull).toHaveBeenCalledWith(
      expect.objectContaining({ anime: { malId: 5114 }, animeMusic: [] })
    )
    expect(result).toEqual({ value: { malId: 5114 }, isStale: false })
  })

  it('propagates the music stale flag into the result', async () => {
    getAnimeByMalId.mockResolvedValue({ malId: 5114 })
    primeRepos()
    getMusicByAnimeId.mockResolvedValue({ value: [], isStale: true })
    mapFull.mockReturnValue({ malId: 5114 })

    const result = await animeFullService.getAnimeFullByMalId(5114)

    expect(result.isStale).toBe(true)
  })
})
