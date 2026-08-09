/**
 * Cache helpers for music tracks linked to an anime.
 *
 * @module domains/music/cache/anime-music-cache
 * @remarks
 * Read-through cache for {@link getMusicByAnimeId} results, keyed by anime ID
 * under the `CacheKeyPrefix.MusicByAnime` namespace with a medium TTL. Mirrors
 * {@link musicCache} so anime detail pages reuse the same key shape.
 *
 * **Key format:** `music:anime:{animeId}`
 *
 * **TTL:** `CacheTtl.Medium` (3600 s) — music catalog rows are stable but not
 * immutable, so one hour keeps detail pages warm without way stale rows.
 *
 * @see {@link getMusicByAnimeId} for the read-through consumer
 * @see {@link CacheKeyPrefix.MusicByAnime} for the key prefix constant
 */
import type { MusicDB } from '@music/types/music-db-types'
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'

/**
 * Read-through cache for anime-linked music keyed by anime MAL ID.
 */
export const animeMusicCache = {
  /**
   * Builds the Redis cache key for an anime's music list.
   *
   * @param animeId - Internal anime identifier (MAL ID in this schema)
   * @returns Deterministic cache key string
   *
   * @example
   * ```typescript
   * animeMusicCache.key(5114) // 'music:anime:5114'
   * ```
   */
  key: (animeId: number) => `${CacheKeyPrefix.MusicByAnime}:${animeId}`,

  /**
   * Retrieves cached music tracks for an anime.
   *
   * @param animeId - Internal anime identifier
   * @returns {@link MusicDB}[] on hit, `null` on miss
   */
  async get(animeId: number): Promise<MusicDB[] | null> {
    return cacheGet<MusicDB[]>(animeMusicCache.key(animeId))
  },

  /**
   * Stores an anime's music list in Redis.
   *
   * @param animeId - Internal anime identifier
   * @param tracks - Partial {@link MusicDB} rows linked to the anime
   */
  async set(animeId: number, tracks: MusicDB[]): Promise<void> {
    return cacheSet<MusicDB[]>(animeMusicCache.key(animeId), tracks, {
      ttlSeconds: CacheTtl.Medium,
    })
  },
}
