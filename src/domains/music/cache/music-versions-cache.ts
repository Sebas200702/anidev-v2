/**
 * Cache helpers for music version and resolution payloads.
 *
 * @module @domains/music/cache/music-versions-cache
 * @remarks
 * Read-through cache for playable version trees keyed by internal music ID.
 * Separated from metadata so URL-heavy payloads can expire sooner.
 *
 * **Key format:** `music:versions:{id}`
 *
 * **TTL:** `CacheTtl.Medium` (3600 s)
 *
 * @see {@link musicService.getMusicDetailsById}
 * @see {@link musicMediaResolver} for `/media/music/:id/:type` playback URLs
 */
import type { MusicVersion } from '@domains/music/types/music-details-types'
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'

export const musicVersionsCache = {
  key(id: number) {
    return `${CacheKeyPrefix.MusicVersions}:${id}`
  },

  async get(id: number): Promise<MusicVersion[] | null> {
    return cacheGet<MusicVersion[]>(this.key(id))
  },

  async set(id: number, value: MusicVersion[]): Promise<void> {
    return cacheSet(this.key(id), value, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
