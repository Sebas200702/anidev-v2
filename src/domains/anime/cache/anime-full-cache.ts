/**
 * Cache helpers for full anime detail payloads.
 *
 * @module domains/anime/cache/anime-full-cache
 * @remarks
 * Read-through cache for {@link AnimeFullDetails} from
 * {@link animeFullService.getAnimeFullByMalId}. Aggregates more tables than
 * {@link animeDetailsCache} (relations, music, external IDs, synonyms).
 *
 * **Key format:** `anime:full:{malId}`
 *
 * **TTL:** `CacheTtl.Medium` (3600 s) — balances freshness of scores/rankings
 * with cost of multi-repo `Promise.all` in the full service.
 *
 * @see {@link animeFullService}
 * @see {@link mapAnimeToFullDetails}
 */
import type { AnimeFullDetails } from '@domains/anime/types'
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'

/**
 * Read-through cache for {@link AnimeFullDetails} keyed by MAL ID.
 */
export const animeFullCache = {
  /**
   * Builds the Redis cache key for a full anime detail entry.
   *
   * @param malId - MyAnimeList identifier
   * @returns `anime:full:{malId}`
   */
  key(malId: number) {
    return `${CacheKeyPrefix.AnimeFull}:${malId}`
  },

  /**
   * Retrieves cached full anime details.
   *
   * @param malId - MyAnimeList identifier
   * @returns {@link AnimeFullDetails} on hit, `null` on miss
   */
  async get(malId: number): Promise<AnimeFullDetails | null> {
    return cacheGet<AnimeFullDetails>(this.key(malId))
  },

  /**
   * Stores full anime details in Redis.
   *
   * @param malId - MyAnimeList identifier
   * @param value - Serialized full payload from {@link mapAnimeToFullDetails}
   */
  async set(malId: number, value: AnimeFullDetails): Promise<void> {
    return cacheSet(this.key(malId), value, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
