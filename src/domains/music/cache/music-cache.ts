import type { MusicDetails } from '@/domains/music/types/music-details'
import { cacheGet, cacheSet } from '@/core/cache'
import { CacheKeyPrefix, CacheTtl } from '@/core/cache/config'
export const musicCache = {
  key: (id: number) => `${CacheKeyPrefix.MusicDetails}:${id}`,
  get: async (id: number): Promise<MusicDetails | null> => {
    const cacheKey = musicCache.key(id)
    return await cacheGet<MusicDetails>(cacheKey)
  },
  set: async (id: number, details: MusicDetails): Promise<void> => {
    const cacheKey = musicCache.key(id)
    await cacheSet(cacheKey, details, { ttlSeconds: CacheTtl.Medium })
  },
}
