/**
 * Cache helpers for anime staff list payloads.
 *
 * @module domains/anime/cache/anime-staff-cache
 * @remarks
 * Read-through cache for {@link AnimeStaff} arrays from
 * {@link animeStaffService.getAnimeStaff}.
 *
 * **Key format:** `anime:staff:{malId}`
 *
 * **TTL:** `CacheTtl.Long` (86400 s) — production credits are stable; daily
 * refresh is sufficient for staff listings.
 *
 * @see {@link animeStaffService}
 * @see {@link mapAnimeStaff}
 */
import { cacheGet, cacheSet } from '@lib/cache'
import type { AnimeStaff } from '@domains/anime/types'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'

/**
 * Read-through cache for anime staff collections keyed by MAL ID.
 */
export const animeStaffCache = {
  /**
   * Builds the Redis cache key for an anime staff list.
   *
   * @param malId - Parent anime MAL ID
   * @returns `anime:staff:{malId}`
   */
  key(malId: number) {
    return `${CacheKeyPrefix.AnimeStaff}:${malId}`
  },

  /**
   * Retrieves cached anime staff.
   *
   * @param malId - Parent anime MAL ID
   * @returns {@link AnimeStaff}[] on hit, `null` on miss
   */
  async get(malId: number): Promise<AnimeStaff[] | null> {
    return await cacheGet<AnimeStaff[]>(this.key(malId))
  },

  /**
   * Stores anime staff in Redis.
   *
   * @param malId - Parent anime MAL ID
   * @param data - Mapped staff list (empty array allowed)
   */
  async set(malId: number, data: AnimeStaff[]) {
    await cacheSet<AnimeStaff[]>(this.key(malId), data, {
      ttlSeconds: CacheTtl.Long,
    })
  },
}
