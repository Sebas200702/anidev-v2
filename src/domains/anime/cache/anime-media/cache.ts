/**
 * Cache helpers for the full media list of an anime.
 *
 * @module domains/anime/cache/anime-media/cache
 * @remarks
 * **Key format:** `anime:media:{malId}` — one entry per anime serves both the
 * filtered/paginated list and the single-asset lookup.
 *
 * **TTL:** `CacheTtl.Long` (86400 s) — media changes only through ingestion.
 *
 * @see {@link animeMediaService}
 */
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'
import type { AnimeMediaItem } from '@anime/types'

/**
 * Read-through cache for an anime's mapped media list.
 */
export const animeMediaCache = {
  /**
   * Builds the key for one anime's media list.
   *
   * @returns `anime:media:{malId}`
   */
  key(malId: number) {
    return `${CacheKeyPrefix.AnimeMedia}:${malId}`
  },

  /** Retrieves the cached list, or `null` on miss. */
  async get(malId: number): Promise<AnimeMediaItem[] | null> {
    return await cacheGet<AnimeMediaItem[]>(this.key(malId))
  },

  /** Stores the list with the long TTL. */
  async set(malId: number, data: AnimeMediaItem[]) {
    await cacheSet<AnimeMediaItem[]>(this.key(malId), data, {
      ttlSeconds: CacheTtl.Long,
    })
  },
}
