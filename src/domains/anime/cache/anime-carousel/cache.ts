/**
 * Redis cache for the featured-anime carousel.
 *
 * @module domains/anime/cache/anime-carousel/cache
 */
import type { CarouselItem } from '@anime/types'
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'

const CAROUSEL_CACHE_KEY = `${CacheKeyPrefix.AnimeList}:carousel`

/**
 * Read/write access to the single carousel payload.
 *
 * @remarks
 * **Key:** `anime:list:carousel` — one global entry (no per-user variants).
 *
 * **TTL:** {@link CacheTtl.Medium} (3600 s)
 *
 * @see {@link animeCarouselService}
 */
export const animeCarouselCache = {
  /** Returns the cache key. */
  key() {
    return CAROUSEL_CACHE_KEY
  },

  /** Reads the cached slides, or `null` on a miss. */
  async get(): Promise<CarouselItem[] | null> {
    return cacheGet<CarouselItem[]>(CAROUSEL_CACHE_KEY)
  },

  /** Stores the slides for {@link CacheTtl.Medium}. */
  async set(value: CarouselItem[]): Promise<void> {
    return cacheSet<CarouselItem[]>(CAROUSEL_CACHE_KEY, value, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
