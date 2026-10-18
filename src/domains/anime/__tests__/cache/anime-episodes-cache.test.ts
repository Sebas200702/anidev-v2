/**
 * Tests for {@link animeEpisodesCache}.
 *
 * @module domains/anime/__tests__/cache/anime-episodes-cache
 * @remarks
 * Pins the page/detail key formats (they are part of the D-E4 contract) and the delegation of
 * reads/writes to the shared client with the long TTL. `@lib/cache` is mocked.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', REDIS_URL: 'redis://localhost:6379' },
}))

const { cacheGet, cacheSet } = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))
vi.mock('@lib/cache', () => ({ cacheGet, cacheSet }))

const { animeEpisodesCache } = await import('@anime/cache/anime-episodes')
const { CacheTtl } = await import('@lib/cache/config')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('animeEpisodesCache', () => {
  it('keys pages by anime, page and limit', () => {
    expect(animeEpisodesCache.pageKey(1, 2, 24)).toBe('anime:episodes:1:2:24')
  })

  it('keys a detail by anime and episode number', () => {
    expect(animeEpisodesCache.episodeKey(1, 5)).toBe('anime:episode:1:5')
  })

  it('reads and writes a page with the long TTL', async () => {
    const page = { list: [], total: 0 }
    cacheGet.mockResolvedValue(page)
    await expect(animeEpisodesCache.getPage(1, 1, 24)).resolves.toBe(page)
    expect(cacheGet).toHaveBeenCalledWith('anime:episodes:1:1:24')

    await animeEpisodesCache.setPage(1, 1, 24, page)
    expect(cacheSet).toHaveBeenCalledWith('anime:episodes:1:1:24', page, {
      ttlSeconds: CacheTtl.Long,
    })
  })

  it('reads and writes a detail with the long TTL', async () => {
    const detail = { id: 1, number: 5 } as never
    await animeEpisodesCache.getEpisode(1, 5)
    expect(cacheGet).toHaveBeenCalledWith('anime:episode:1:5')

    await animeEpisodesCache.setEpisode(1, 5, detail)
    expect(cacheSet).toHaveBeenCalledWith('anime:episode:1:5', detail, {
      ttlSeconds: CacheTtl.Long,
    })
  })
})
