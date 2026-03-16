import type { AnimeDetails } from '@/domains/anime/types/anime-details'
import { cacheGet, cacheSet } from '@/core/cache'
import { CacheTtl, CacheKeyPrefix } from '@/core/cache/config'


export const animeDetailsCache = {
  key(malId: number) {
    return `${CacheKeyPrefix.AnimeDetails}:${malId}`
  },

  async get(malId: number): Promise<AnimeDetails | null> {
    return cacheGet<AnimeDetails>(this.key(malId))
  },

  async set(malId: number, value: AnimeDetails): Promise<void> {
    return cacheSet(this.key(malId), value, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
