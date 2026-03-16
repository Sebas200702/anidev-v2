import type { AnimeFullDetails } from '@/domains/anime/types/anime-full'
import { cacheGet, cacheSet } from '@/core/cache'
import { CacheKeyPrefix, CacheTtl } from '@/core/cache/config'

export const animeFullCache = {
  key(malId: number) {
    return `${CacheKeyPrefix.AnimeFull}:${malId}`
  },

  async get(malId: number): Promise<AnimeFullDetails | null> {
    return cacheGet<AnimeFullDetails>(this.key(malId))
  },
  async set(malId: number, value: AnimeFullDetails): Promise<void> {
    return cacheSet(this.key(malId), value, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
