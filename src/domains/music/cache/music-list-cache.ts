/**
 * Cache helpers for paginated music list responses.
 *
 * @module domains/music/cache/music-list-cache
 * @remarks
 * Read-through cache for filtered list results from
 * {@link musicListService.getMusicList}. Key includes the full normalized filter
 * object (pagination + facets) via `JSON.stringify`.
 *
 * **Key format:** `music:list:{JSON.stringify(filters)}`
 *
 * **TTL:** `CacheTtl.Medium` (3600 s) — list pages are filter-sensitive; one hour
 * limits stale pagination totals while avoiding repeated list queries.
 *
 * **Null vs miss:** `null` triggers list + count queries; cached value holds
 * `{ list, total }` even when `list` is empty.
 *
 * @see {@link musicListService}
 * @see {@link mapMusicListFilters}
 */
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'
import type { MusicCard, MusicListFilters } from '@domains/music/types'

/**
 * Cached payload for a filtered music list query.
 *
 * @remarks
 * Mirrors the return shape of {@link musicListService.getMusicList}.
 */
type MusicListCacheValue = {
  /** Mapped card rows for the current page */
  list: MusicCard[]
  /** Total rows matching filters (all pages) */
  total: number
}

/**
 * Read-through cache for paginated music list results keyed by filter set.
 */
export const musicListCache = {
  /**
   * Builds the Redis cache key for a music list query.
   *
   * @param filters - Normalized {@link MusicListFilters}
   * @returns `music:list:` + stable JSON of filters (property order matters)
   *
   * @example
   * ```typescript
   * musicListCache.key({ page: 1, limit: 10, type: 'OP' })
   * // 'music:list:{"page":1,"limit":10,"type":"OP"}'
   * ```
   */
  key(filters: MusicListFilters) {
    return `${CacheKeyPrefix.MusicList}:${JSON.stringify(filters)}`
  },

  /**
   * Retrieves a cached music list result.
   *
   * @param filters - Same normalized filters used for `key`
   * @returns `{ list, total }` on hit, `null` on miss
   */
  async get(filters: MusicListFilters): Promise<MusicListCacheValue | null> {
    return cacheGet<MusicListCacheValue>(this.key(filters))
  },

  /**
   * Stores a paginated music list result in Redis.
   *
   * @param filters - Normalized filters
   * @param value - Cards for current page and total count
   */
  async set(
    filters: MusicListFilters,
    value: MusicListCacheValue
  ): Promise<void> {
    return cacheSet<MusicListCacheValue>(this.key(filters), value, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
