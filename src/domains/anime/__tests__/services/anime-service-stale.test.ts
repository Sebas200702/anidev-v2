/**
 * Integration test for stale-serve adoption in {@link animeService}.
 *
 * @module domains/anime/__tests__/services/anime-service-stale
 * @remarks
 * Verifies the graceful-degradation contract end-to-end through the service:
 * 1. DB down with a `:stale` snapshot → `{ value: stale, isStale: true }`.
 * 2. Cache down (reads fail) with a healthy DB → bypass to the repository.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbError } from '@shared/errors/db-errors'
import { ErrorCodes } from '@shared/errors/codes'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    APP_BASE_URL: 'http://localhost:4321',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
    SENTRY_DSN: undefined,
    LOG_LEVEL: 'silent',
  },
}))

const { getMock, setMock, delMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setMock: vi.fn(),
  delMock: vi.fn(),
}))

vi.mock('@lib/cache/client', () => ({
  redis: {
    get: getMock,
    set: setMock,
    del: delMock,
  },
}))

const {
  getAnimeByMalIdMock,
  taxonomyGetGenresMock,
  taxonomyGetThemesMock,
  taxonomyGetDemographicsMock,
  getAnimeMediaMock,
  mapAnimeDetailsMock,
} = vi.hoisted(() => ({
  getAnimeByMalIdMock: vi.fn(),
  taxonomyGetGenresMock: vi.fn(),
  taxonomyGetThemesMock: vi.fn(),
  taxonomyGetDemographicsMock: vi.fn(),
  getAnimeMediaMock: vi.fn(),
  mapAnimeDetailsMock: vi.fn(),
}))

vi.mock('@anime/repositories/anime-repository', () => ({
  animeRepository: {
    getAnimeByMalId: getAnimeByMalIdMock,
  },
}))

vi.mock('@anime/repositories/anime-taxonomy-repository', () => ({
  animeTaxonomyRepository: {
    getGenresByAnimeId: taxonomyGetGenresMock,
    getThemesByAnimeId: taxonomyGetThemesMock,
    getDemographicsByAnimeId: taxonomyGetDemographicsMock,
  },
}))

vi.mock('@media/services/get-anime-media-service', () => ({
  getAnimeMedia: getAnimeMediaMock,
}))

vi.mock('@anime/mappers/anime-mapper', () => ({
  mapAnimeDetails: mapAnimeDetailsMock,
}))

import { animeService } from '@anime/services/anime-service'
import { CacheTtl } from '@lib/cache/config'

const DETAILS = {
  malId: 5114,
  title: 'Cowboy Bebop',
  year: 1998,
  slug: 'cowboy-bebop',
}

describe('animeService stale-serve degradation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAnimeByMalIdMock.mockResolvedValue({
      malId: 5114,
      title: 'Cowboy Bebop',
    })
    taxonomyGetGenresMock.mockResolvedValue([])
    taxonomyGetThemesMock.mockResolvedValue([])
    taxonomyGetDemographicsMock.mockResolvedValue([])
    getAnimeMediaMock.mockResolvedValue([])
    mapAnimeDetailsMock.mockReturnValue(DETAILS)
    setMock.mockResolvedValue('OK')
  })

  it('serves the stale snapshot with isStale: true when the DB is down', async () => {
    getMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify(DETAILS))
    getAnimeByMalIdMock.mockRejectedValueOnce(
      dbError('getAnimeByMalId', { malId: 5114 })
    )

    const result = await animeService.getAnimeDetails(5114)

    expect(result).toEqual({ value: DETAILS, isStale: true })
    expect(getMock).toHaveBeenNthCalledWith(1, 'anime:details:5114')
    expect(getMock).toHaveBeenNthCalledWith(2, 'anime:details:5114:stale')
  })

  it('rethrows InfraError when DB is down and no stale snapshot exists', async () => {
    getMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    getAnimeByMalIdMock.mockRejectedValueOnce(
      dbError('getAnimeByMalId', { malId: 5114 })
    )

    await expect(animeService.getAnimeDetails(5114)).rejects.toMatchObject({
      code: ErrorCodes.DB_ERROR,
    })
  })

  it('bypasses a degraded cache and fetches from the database', async () => {
    getMock.mockRejectedValueOnce(new Error('cache connection refused'))

    const result = await animeService.getAnimeDetails(5114)

    expect(result).toEqual({ value: DETAILS, isStale: false })
    expect(getAnimeByMalIdMock).toHaveBeenCalledWith(5114)
    expect(setMock).toHaveBeenCalledWith(
      'anime:details:5114',
      JSON.stringify(DETAILS),
      'EX',
      CacheTtl.Medium
    )
  })

  it('writes the stale snapshot with CacheTtl.Stale after a successful compute', async () => {
    getMock.mockResolvedValueOnce(null)

    await animeService.getAnimeDetails(5114)

    expect(setMock).toHaveBeenCalledWith(
      'anime:details:5114:stale',
      JSON.stringify(DETAILS),
      'EX',
      CacheTtl.Stale
    )
  })
})
