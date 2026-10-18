/**
 * Tests for {@link animeEpisodesService}.
 *
 * @module domains/anime/__tests__/services/anime-episodes-service
 * @remarks
 * Runs the compute pipeline in isolation ({@link withStaleCache} mocked to run `compute`). Covers
 * the D-E3 not-found semantics: the anime existence check runs only when the page total is zero or
 * the episode is missing, and decides between `ANIME_NOT_FOUND` and `EPISODE_NOT_FOUND`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorCodes } from '@shared/errors/codes'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))
vi.mock('@lib/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  withStaleCache: async (opts: { compute: () => Promise<unknown> }) => ({
    value: await opts.compute(),
    isStale: false,
  }),
}))

const { getPage, countEpisodes, getEpisode, getAnime } = vi.hoisted(() => ({
  getPage: vi.fn(),
  countEpisodes: vi.fn(),
  getEpisode: vi.fn(),
  getAnime: vi.fn(),
}))
vi.mock('@anime/repositories/anime-episodes', () => ({
  animeEpisodesRepository: {
    getEpisodesPage: getPage,
    countEpisodes,
    getEpisodeByNumber: getEpisode,
  },
}))
vi.mock('@media/mappers/media-url', () => ({
  buildMediaUrl: () => 'http://localhost:4321/media/episode/10/thumbnail',
}))
vi.mock('@anime/repositories/anime', () => ({
  animeRepository: { getAnimeByMalId: getAnime },
}))

const { animeEpisodesService } = await import('@anime/services/anime-episodes')

const row = {
  id: 10,
  animeId: 1,
  number: 1,
  title: 'Asteroid Blues',
  synopsis: 'Tijuana.',
  duration: '25 min',
  aired: '1998-10-23',
}
const input = { malId: 1, page: 1, limit: 24 }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('animeEpisodesService.getEpisodes', () => {
  it('maps the page and returns the total without an anime lookup', async () => {
    getPage.mockResolvedValue([row])
    countEpisodes.mockResolvedValue(26)

    const { value } = await animeEpisodesService.getEpisodes(input)

    expect(getPage).toHaveBeenCalledWith(input)
    expect(value.total).toBe(26)
    expect(value.list).toEqual([
      expect.objectContaining({ id: 10, number: 1, title: 'Asteroid Blues' }),
    ])
    expect(getAnime).not.toHaveBeenCalled()
  })

  it('returns an empty page for an existing anime with no episodes', async () => {
    getPage.mockResolvedValue([])
    countEpisodes.mockResolvedValue(0)
    getAnime.mockResolvedValue({ malId: 1 })

    const { value } = await animeEpisodesService.getEpisodes(input)

    expect(value).toEqual({ list: [], total: 0 })
  })

  it('throws ANIME_NOT_FOUND when the anime does not exist', async () => {
    getPage.mockResolvedValue([])
    countEpisodes.mockResolvedValue(0)
    getAnime.mockResolvedValue(undefined)

    await expect(animeEpisodesService.getEpisodes(input)).rejects.toMatchObject(
      { code: ErrorCodes.ANIME_NOT_FOUND }
    )
  })
})

describe('animeEpisodesService.getEpisode', () => {
  it('maps the episode with its synopsis', async () => {
    getEpisode.mockResolvedValue(row)

    const { value } = await animeEpisodesService.getEpisode(1, 1)

    expect(getEpisode).toHaveBeenCalledWith(1, 1)
    expect(value.synopsis).toBe('Tijuana.')
    expect(getAnime).not.toHaveBeenCalled()
  })

  it('throws EPISODE_NOT_FOUND when the anime exists', async () => {
    getEpisode.mockResolvedValue(undefined)
    getAnime.mockResolvedValue({ malId: 1 })

    await expect(animeEpisodesService.getEpisode(1, 99)).rejects.toMatchObject({
      code: ErrorCodes.EPISODE_NOT_FOUND,
    })
  })

  it('throws ANIME_NOT_FOUND when the anime is missing', async () => {
    getEpisode.mockResolvedValue(undefined)
    getAnime.mockResolvedValue(undefined)

    await expect(animeEpisodesService.getEpisode(2, 1)).rejects.toMatchObject({
      code: ErrorCodes.ANIME_NOT_FOUND,
    })
  })
})
