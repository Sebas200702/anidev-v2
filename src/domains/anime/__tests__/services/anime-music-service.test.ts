/**
 * Tests for {@link animeMusicService}.
 *
 * @module domains/anime/__tests__/services/anime-music-service
 * @remarks
 * Runs against the real item mapper with {@link getMusicByAnimeId} and the anime repository
 * mocked, so the asserted items are the ones `/api/anime/:malId/music` serves: OP/ED only, the
 * same `order`/`url` `/full` exposes, plus the music `id` addressable by the detail endpoint.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorCodes } from '@shared/errors/codes'

vi.mock('@/config', () => ({
  config: { baseUrl: 'https://anidev.test' },
}))

const { getMusic, getAnime } = vi.hoisted(() => ({
  getMusic: vi.fn(),
  getAnime: vi.fn(),
}))
vi.mock('@music/services/anime-music', () => ({
  getMusicByAnimeId: getMusic,
}))
vi.mock('@anime/repositories/anime', () => ({
  animeRepository: { getAnimeByMalId: getAnime },
}))

const { animeMusicService } = await import('@anime/services/anime-music')

const theme = (
  id: number,
  type: string,
  title: string | null,
  sequence: number | null
) => ({ id, title, type, sequence, episodes: '1-12' })

// Repository order (sequence NULLS LAST, id); the insert song is not a theme.
const rows = [
  theme(10, 'OP', 'Blue Bird', 1),
  theme(20, 'ED', 'Long Kiss', 1),
  theme(11, 'OP', 'Closer', 2),
  theme(30, 'Insert', 'Interlude', 3),
  theme(21, 'ED', null, null),
]

const opening1 = {
  id: 10,
  order: 1,
  title: 'Blue Bird',
  type: 'opening',
  episodes: '1-12',
  url: 'https://anidev.test/music/10/Blue-Bird',
}

const resolve = (value: unknown[]) =>
  getMusic.mockResolvedValue({ value, isStale: false })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('animeMusicService.getMusicPage', () => {
  it('maps openings and endings with their id, skipping other types', async () => {
    resolve(rows)

    const { value, isStale } = await animeMusicService.getMusicPage({
      malId: 1,
      page: 1,
      limit: 24,
    })

    expect(getMusic).toHaveBeenCalledWith(1)
    expect(isStale).toBe(false)
    expect(value.total).toBe(4)
    expect(value.list).toEqual([
      opening1,
      {
        id: 20,
        order: 1,
        title: 'Long Kiss',
        type: 'ending',
        episodes: '1-12',
        url: 'https://anidev.test/music/20/Long-Kiss',
      },
      expect.objectContaining({ id: 11, order: 2, type: 'opening' }),
      expect.objectContaining({
        id: 21,
        order: 2,
        title: 'Unknown Title',
        type: 'ending',
      }),
    ])
    expect(getAnime).not.toHaveBeenCalled()
  })

  it('filters by type and paginates, counting the filter', async () => {
    resolve(rows)

    const { value } = await animeMusicService.getMusicPage({
      malId: 1,
      type: 'ending',
      page: 2,
      limit: 1,
    })

    expect(value.total).toBe(2)
    expect(value.list).toEqual([expect.objectContaining({ id: 21 })])
  })

  it('propagates the stale flag', async () => {
    getMusic.mockResolvedValue({ value: rows, isStale: true })

    const { isStale } = await animeMusicService.getMusicPage({
      malId: 1,
      page: 1,
      limit: 24,
    })

    expect(isStale).toBe(true)
  })

  it('returns an empty page for an existing anime with no music', async () => {
    resolve([])
    getAnime.mockResolvedValue({ malId: 1 })

    const { value } = await animeMusicService.getMusicPage({
      malId: 1,
      page: 1,
      limit: 24,
    })

    expect(value).toEqual({ list: [], total: 0 })
    expect(getAnime).toHaveBeenCalledWith(1)
  })

  it('throws ANIME_NOT_FOUND when the anime does not exist', async () => {
    resolve([])
    getAnime.mockResolvedValue(undefined)

    await expect(
      animeMusicService.getMusicPage({ malId: 999, page: 1, limit: 24 })
    ).rejects.toMatchObject({ code: ErrorCodes.ANIME_NOT_FOUND })
  })
})

describe('animeMusicService.getMusicItem', () => {
  it('returns the same item the list exposes', async () => {
    resolve(rows)

    const { value } = await animeMusicService.getMusicItem(1, 10)

    expect(value).toEqual(opening1)
  })

  it('throws MUSIC_NOT_FOUND when the id is not a theme of the anime', async () => {
    resolve(rows)

    for (const musicId of [42, 30]) {
      await expect(
        animeMusicService.getMusicItem(1, musicId)
      ).rejects.toMatchObject({
        code: ErrorCodes.MUSIC_NOT_FOUND,
        details: { malId: 1, musicId },
      })
    }
  })

  it('throws ANIME_NOT_FOUND when the anime does not exist', async () => {
    resolve([])
    getAnime.mockResolvedValue(undefined)

    await expect(animeMusicService.getMusicItem(999, 1)).rejects.toMatchObject({
      code: ErrorCodes.ANIME_NOT_FOUND,
    })
  })
})
