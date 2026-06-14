/**
 * Cache helpers for stable music metadata payloads.
 *
 * @module @domains/music/cache/music-metadata-cache
 * @remarks
 * Read-through cache for {@link MusicMetadata} keyed by internal music ID.
 * Stores title, type labels, and artist credits without playback URLs so list
 * and detail flows can reuse the same warm entries.
 *
 * **Key format:** `music:metadata:{id}`
 *
 * **TTL:** `CacheTtl.Long` (86400 s) — catalog metadata changes infrequently.
 *
 * @see {@link musicMetadataLoader}
 */
import type { MusicMetadata } from '@domains/music/types/music-metadata-types'
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'

export const musicMetadataCache = {
  key(id: number) {
    return `${CacheKeyPrefix.MusicMetadata}:${id}`
  },

  async get(id: number): Promise<MusicMetadata | null> {
    return cacheGet<MusicMetadata>(this.key(id))
  },

  async set(id: number, value: MusicMetadata): Promise<void> {
    return cacheSet(this.key(id), value, {
      ttlSeconds: CacheTtl.Long,
    })
  },

  async getMany(ids: number[]): Promise<Map<number, MusicMetadata>> {
    if (ids.length === 0) return new Map()

    const entries = await Promise.all(
      ids.map(async (id) => [id, await this.get(id)] as const)
    )

    return entries.reduce<Map<number, MusicMetadata>>((acc, [id, value]) => {
      if (value) acc.set(id, value)
      return acc
    }, new Map())
  },
}
