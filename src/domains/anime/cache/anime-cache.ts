/**
 * Cache helpers for anime detail page payloads.
 *
 * @module domains/anime/cache/anime-cache
 * @remarks
 * Read-through cache for {@link AnimeDetails} produced by
 * {@link animeService.getAnimeDetails}. Uses Redis via `@lib/cache`.
 *
 * **Key format:** `anime:details:{malId}` (`CacheKeyPrefix.AnimeDetails`)
 *
 * **TTL:** `CacheTtl.Medium` (3600 s) — detail pages change infrequently but
 * should refresh within an hour for score/status updates.
 *
 * **Null vs miss:** `cacheGet` returns `null` on miss; the service recomputes
 * via `withCache`. A cached `null` is not stored for missing anime (service throws
 * {@link AnimeNotFoundError} before `set`).
 *
 * @see {@link animeService}
 * @see {@link mapAnimeDetails}
 */
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheTtl, CacheKeyPrefix } from '@lib/cache/config'
import type { AnimeDetails } from '@domains/anime/types'

/**
 * Read-through cache for {@link AnimeDetails} keyed by MAL ID.
 */
export const animeDetailsCache = {
  /**
   * Builds the Redis cache key for an anime detail entry.
   *
   * @param malId - MyAnimeList identifier
   * @returns Key string `{@link CacheKeyPrefix.AnimeDetails}:{malId}`
   *
   * @example
   * ```typescript
   * animeDetailsCache.key(5114) // 'anime:details:5114'
   * ```
   */
  key(malId: number) {
    return `${CacheKeyPrefix.AnimeDetails}:${malId}`
  },

  /**
   * Retrieves cached anime details.
   *
   * @param malId - MyAnimeList identifier
   * @returns Cached {@link AnimeDetails}, or `null` on cache miss (not "anime missing")
   *
   * @remarks
   * `null` means no Redis entry — not that the anime does not exist. The service
   * layer distinguishes miss vs not-found.
   */
  async get(malId: number): Promise<AnimeDetails | null> {
    return cacheGet<AnimeDetails>(this.key(malId))
  },

  /**
   * Stores anime details in Redis.
   *
   * @param malId - MyAnimeList identifier
   * @param value - Serialized {@link AnimeDetails} from {@link mapAnimeDetails}
   * @returns Resolves when the entry is written with {@link CacheTtl.Medium} TTL
   */
  async set(malId: number, value: AnimeDetails): Promise<void> {
    return cacheSet(this.key(malId), value, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
