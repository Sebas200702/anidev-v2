/**
 * Cache helpers for paginated anime list responses.
 *
 * @module domains/anime/cache/anime-list-cache
 * @remarks
 * Read-through cache for filtered list results from
 * {@link animeListService.getAnimeList}. Key includes the full normalized filter
 * object (pagination + facets) via `JSON.stringify`.
 *
 * **Key format:** `anime:list:{JSON.stringify(filters)}`
 *
 * **TTL:** `CacheTtl.Medium` (3600 s) — list pages are filter-sensitive; one hour
 * limits stale pagination totals while avoiding repeated `selectDistinct` joins.
 *
 * **Null vs miss:** `null` triggers list + count queries; cached value holds
 * `{ list, total }` even when `list` is empty.
 *
 * @see {@link animeListService}
 * @see {@link mapAnimeFilters}
 */
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'
import type { AnimeCard, AnimeFilters } from '@domains/anime/types'

/**
 * Cached payload for a filtered anime list query.
 *
 * @remarks
 * Mirrors the return shape of {@link animeListService.getAnimeList}.
 */
type AnimeListCacheValue = {
  /** Mapped card rows for the current page */
  list: AnimeCard[]
  /** Total distinct anime rows matching filters (all pages) */
  total: number
}

/**
 * Read-through cache for paginated anime list results keyed by filter set.
 */
export const animeListCache = {
  /**
   * Builds the Redis cache key for an anime list query.
   *
   * @param filters - Normalized {@link AnimeFilters} (arrays for multi-select facets)
   * @returns `anime:list:` + stable JSON of filters (property order matters)
   *
   * @example
   * ```typescript
   * animeListCache.key({ page: 1, limit: 10, genre: ['Action'] })
   * // 'anime:list:{"page":1,"limit":10,"genre":["Action"]}'
   * ```
   */
  key(filters: AnimeFilters) {
    return `${CacheKeyPrefix.AnimeList}:${JSON.stringify(filters)}`
  },

  /**
   * Retrieves a cached anime list result.
   *
   * @param filters - Same normalized filters used for `key`
   * @returns `{ list, total }` on hit, `null` on miss
   */
  async get(filters: AnimeFilters): Promise<AnimeListCacheValue | null> {
    return cacheGet<AnimeListCacheValue>(this.key(filters))
  },

  /**
   * Stores a paginated anime list result in Redis.
   *
   * @param filters - Normalized filters
   * @param value - Cards for current page and total count
   */
  async set(filters: AnimeFilters, value: AnimeListCacheValue): Promise<void> {
    return cacheSet<AnimeListCacheValue>(this.key(filters), value, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
