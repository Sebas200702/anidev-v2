/**
 * Cache helpers for paginated printed-media (manga) list responses.
 *
 * @module domains/manga/cache/manga-list/cache
 * @remarks
 * Read-through cache for filtered list results. The key includes the full
 * normalized filter object (pagination + facets) via `stableStringify`.
 *
 * **Key format:** `manga:list:{stableStringify(filters)}`
 */
import { cacheGet, cacheSet } from '@lib/cache'
import { stableStringify } from '@lib/cache/stable-stringify'
import { CacheTtl } from '@lib/cache/config'
import type { MangaCard, MangaFilters } from '@manga/types'

/** Cached payload for a filtered printed-media list query. */
export interface MangaListCacheValue {
  /** Mapped card rows for the current page */
  list: MangaCard[]
  /** Total distinct rows matching filters (all pages) */
  total: number
}

/**
 * Read-through cache for paginated printed-media list results.
 */
export const mangaListCache = {
  /**
   * Builds the cache key for a printed-media list query.
   *
   * @param filters - Normalized {@link MangaFilters}
   * @returns `manga:list:` + stable JSON of filters
   */
  key(filters: MangaFilters) {
    return `manga:list:${stableStringify(filters)}`
  },

  /**
   * Retrieves a cached list result.
   *
   * @param filters - Same normalized filters used for `key`
   * @returns `{ list, total }` on hit, `null` on miss
   */
  async get(filters: MangaFilters): Promise<MangaListCacheValue | null> {
    return cacheGet<MangaListCacheValue>(this.key(filters))
  },

  /**
   * Stores a paginated list result.
   *
   * @param filters - Normalized filters
   * @param value - Cards for the current page and the total count
   */
  async set(filters: MangaFilters, value: MangaListCacheValue): Promise<void> {
    return cacheSet<MangaListCacheValue>(this.key(filters), value, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
