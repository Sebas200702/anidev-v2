/**
 * Tests for {@link animeMediaService}.
 *
 * @module domains/anime/__tests__/services/anime-media-service
 * @remarks
 * Runs the compute pipeline in isolation ({@link withStaleCache} mocked to run `compute`) against
 * the real mapper and URL builder, so the proxy URLs asserted here are the ones `/media` resolves:
 * 1-based index per (type, size, source) group over the whole anime, never per page.
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

const { getMedia, getAnime } = vi.hoisted(() => ({
  getMedia: vi.fn(),
  getAnime: vi.fn(),
}))
vi.mock('@media/repositories/anime-media', () => ({
  animeMediaRepository: { getMediaByAnimeId: getMedia },
}))
vi.mock('@anime/repositories/anime', () => ({
  animeRepository: { getAnimeByMalId: getAnime },
}))

const { animeMediaService } = await import('@anime/services/anime-media')

const asset = (id: number, mediaType: string, src: string, size = null) => ({
  id,
  animeId: 1,
  mediaType,
  src,
  size,
  source: null,
  priority: 100,
})

// Repository order (priority, id): two AniList banners, a TVDB banner, a poster.
const rows = [
  asset(7, 'banner', 'https://s4.anilist.co/banner/a.jpg'),
  asset(3, 'banner', 'https://s4.anilist.co/banner/b.jpg'),
  asset(9, 'banner', 'https://artworks.thetvdb.com/banner/c.jpg'),
  asset(4, 'poster', 'https://cdn.myanimelist.net/images/anime/1.jpg'),
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('animeMediaService.getMediaPage', () => {
  it('maps every asset to a /media proxy URL indexed per type/size/source', async () => {
    getMedia.mockResolvedValue(rows)

    const { value } = await animeMediaService.getMediaPage({
      malId: 1,
      page: 1,
      limit: 24,
    })

    expect(getMedia).toHaveBeenCalledWith(1)
    expect(value.total).toBe(4)
    expect(value.list).toEqual([
      {
        id: 7,
        mediaType: 'banner',
        size: 'default',
        source: 'anilist',
        url: '/media/anime/1/banner/default/1?source=anilist',
      },
      {
        id: 3,
        mediaType: 'banner',
        size: 'default',
        source: 'anilist',
        url: '/media/anime/1/banner/default/2?source=anilist',
      },
      {
        id: 9,
        mediaType: 'banner',
        size: 'default',
        source: 'thetvdb',
        url: '/media/anime/1/banner/default/1?source=thetvdb',
      },
      {
        id: 4,
        mediaType: 'poster',
        size: 'default',
        source: 'myanimelist',
        url: '/media/anime/1/poster/default/1?source=myanimelist',
      },
    ])
    expect(getAnime).not.toHaveBeenCalled()
  })

  it('filters by type and paginates without changing proxy indices', async () => {
    getMedia.mockResolvedValue(rows)

    const { value } = await animeMediaService.getMediaPage({
      malId: 1,
      type: 'banner',
      page: 2,
      limit: 1,
    })

    expect(value.total).toBe(3)
    expect(value.list).toEqual([
      expect.objectContaining({
        id: 3,
        url: '/media/anime/1/banner/default/2?source=anilist',
      }),
    ])
  })

  it('returns an empty page for an existing anime with no media', async () => {
    getMedia.mockResolvedValue([])
    getAnime.mockResolvedValue({ malId: 1 })

    const { value } = await animeMediaService.getMediaPage({
      malId: 1,
      page: 1,
      limit: 24,
    })

    expect(value).toEqual({ list: [], total: 0 })
    expect(getAnime).toHaveBeenCalledWith(1)
  })

  it('throws ANIME_NOT_FOUND when the anime does not exist', async () => {
    getMedia.mockResolvedValue([])
    getAnime.mockResolvedValue(undefined)

    await expect(
      animeMediaService.getMediaPage({ malId: 999, page: 1, limit: 24 })
    ).rejects.toMatchObject({ code: ErrorCodes.ANIME_NOT_FOUND })
  })
})

describe('animeMediaService.getMediaItem', () => {
  it('returns the asset with the same URL the list exposes', async () => {
    getMedia.mockResolvedValue(rows)

    const { value } = await animeMediaService.getMediaItem(1, 3)

    expect(value).toEqual({
      id: 3,
      mediaType: 'banner',
      size: 'default',
      source: 'anilist',
      url: '/media/anime/1/banner/default/2?source=anilist',
    })
  })

  it('throws MEDIA_NOT_FOUND when the id does not belong to the anime', async () => {
    getMedia.mockResolvedValue(rows)
    getAnime.mockResolvedValue({ malId: 1 })

    await expect(animeMediaService.getMediaItem(1, 42)).rejects.toMatchObject({
      code: ErrorCodes.MEDIA_NOT_FOUND,
      details: { malId: 1, mediaId: 42 },
    })
  })

  it('throws ANIME_NOT_FOUND when the anime does not exist', async () => {
    getMedia.mockResolvedValue([])
    getAnime.mockResolvedValue(undefined)

    await expect(animeMediaService.getMediaItem(999, 1)).rejects.toMatchObject({
      code: ErrorCodes.ANIME_NOT_FOUND,
    })
  })
})
