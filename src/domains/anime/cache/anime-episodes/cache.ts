/**
 * Cache helpers for anime episode list pages and episode details.
 *
 * @module domains/anime/cache/anime-episodes/cache
 * @remarks
 * **Key formats:** `anime:episodes:{malId}:{page}:{limit}` and
 * `anime:episode:{malId}:{number}`.
 *
 * **TTL:** `CacheTtl.Long` (86400 s) — episodes change only through ingestion.
 *
 * @see {@link animeEpisodesService}
 */
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'
import type { AnimeEpisodeDetail } from '@anime/types'
import type { AnimeEpisodesPage } from './types'

/**
 * Read-through cache for episode pages and details.
 */
export const animeEpisodesCache = {
  /**
   * Builds the key for one list page.
   *
   * @returns `anime:episodes:{malId}:{page}:{limit}`
   */
  pageKey(malId: number, page: number, limit: number) {
    return `${CacheKeyPrefix.AnimeEpisodes}:${malId}:${page}:${limit}`
  },

  /**
   * Builds the key for one episode detail.
   *
   * @returns `anime:episode:{malId}:{number}`
   */
  episodeKey(malId: number, number: number) {
    return `${CacheKeyPrefix.AnimeEpisode}:${malId}:${number}`
  },

  /** Retrieves a cached page, or `null` on miss. */
  async getPage(
    malId: number,
    page: number,
    limit: number
  ): Promise<AnimeEpisodesPage | null> {
    return await cacheGet<AnimeEpisodesPage>(this.pageKey(malId, page, limit))
  },

  /** Stores a page with the long TTL. */
  async setPage(
    malId: number,
    page: number,
    limit: number,
    data: AnimeEpisodesPage
  ) {
    await cacheSet<AnimeEpisodesPage>(this.pageKey(malId, page, limit), data, {
      ttlSeconds: CacheTtl.Long,
    })
  },

  /** Retrieves a cached episode detail, or `null` on miss. */
  async getEpisode(
    malId: number,
    number: number
  ): Promise<AnimeEpisodeDetail | null> {
    return await cacheGet<AnimeEpisodeDetail>(this.episodeKey(malId, number))
  },

  /** Stores an episode detail with the long TTL. */
  async setEpisode(malId: number, number: number, data: AnimeEpisodeDetail) {
    await cacheSet<AnimeEpisodeDetail>(this.episodeKey(malId, number), data, {
      ttlSeconds: CacheTtl.Long,
    })
  },
}
