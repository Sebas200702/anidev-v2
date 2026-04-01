import { cacheGet, cacheSet } from '@/core/cache'
import { CacheKeyPrefix, CacheTtl } from '@/core/cache/config'
import type { AnimeCard } from '@/domains/anime/types/anime-card'
import type { AnimeFilters } from '../types/anime-list'

export const animeListCache = {
  key(filters: AnimeFilters) {
    return `${CacheKeyPrefix.AnimeList}:${JSON.stringify(filters)}`
  },

  async get(filters: AnimeFilters): Promise<{
    list: AnimeCard[]
    total: number
  } | null> {
    return cacheGet<{ list: AnimeCard[]; total: number }>(this.key(filters))
  },

  async set(
    filters: AnimeFilters,
    value: { list: AnimeCard[]; total: number }
  ): Promise<void> {
    return cacheSet<{ list: AnimeCard[]; total: number }>(
      this.key(filters),
      value,
      {
        ttlSeconds: CacheTtl.Medium,
      }
    )
  },
}
