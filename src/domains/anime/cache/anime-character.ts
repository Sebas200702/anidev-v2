import { cacheGet, cacheSet } from '@/core/cache'
import type { AnimeCharacter } from '@/domains/anime/types/anime-character'
import { CacheKeyPrefix, CacheTtl } from '@/core/cache/config'

export const animeCharacterCache = {
  key(malId: number) {
    return `${CacheKeyPrefix.AnimeCharacters}:${malId}`
  },

  async get(malId: number): Promise<AnimeCharacter[] | null> {
    return cacheGet<AnimeCharacter[]>(this.key(malId))
  },

  async set(malId: number, value: AnimeCharacter[]): Promise<void> {
    return cacheSet(this.key(malId), value, {
      ttlSeconds: CacheTtl.Long,
    })
  },
}
