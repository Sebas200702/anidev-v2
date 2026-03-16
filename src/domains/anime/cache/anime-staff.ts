import { cacheGet, cacheSet } from '@/core/cache'
import type { AnimeStaff } from '@/domains/anime/types/anime-staff'
import { CacheKeyPrefix, CacheTtl } from '@/core/cache/config'

export const animeStaffCache = {
  key(malId: number) {
    return `${CacheKeyPrefix.AnimeStaff}:${malId}`
  },
  async get(malId: number): Promise<AnimeStaff[] | null> {
    return await cacheGet<AnimeStaff[]>(this.key(malId))
  },
  async set(malId: number, data: AnimeStaff[]) {
    await cacheSet<AnimeStaff[]>(this.key(malId), data, {
      ttlSeconds: CacheTtl.Long,
    })
  },
}
