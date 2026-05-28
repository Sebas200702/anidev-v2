/**
 * @module @domains/music/cache/music-cache
 * @remarks Read-through cache helpers for music detail payloads. Keys use the
 * `CacheKeyPrefix.MusicDetails` prefix with the internal music ID and a medium TTL.
 */
import type { MusicDetails } from '@domains/music/types/music-details.d-types'
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'

/**
 * Cache helpers for music detail responses keyed by music ID.
 *
 * @remarks Each method builds deterministic keys via {@link musicCache.key} so callers
 * and {@link musicService} share the same cache namespace.
 * @see {@link musicService.getMusicDetailsById} for the read-through consumer
 * @see {@link CacheKeyPrefix.MusicDetails} for the key prefix constant
 * @example
 * ```typescript
 * import { musicCache } from '@domains/music/cache/music-cache'
 *
 * const key = musicCache.key(42) // "music-details:42"
 * const hit = await musicCache.get(42)
 * if (!hit) await musicCache.set(42, details)
 * ```
 */
export const musicCache = {
  /**
   * Builds the cache key for a music detail payload.
   *
   * @remarks Keys follow the pattern `{CacheKeyPrefix.MusicDetails}:{id}`.
   * @param id - Internal music identifier
   * @returns Deterministic cache key string
   * @see {@link CacheKeyPrefix.MusicDetails}
   * @example
   * ```typescript
   * musicCache.key(42) // "music-details:42"
   * ```
   */
  key: (id: number) => `${CacheKeyPrefix.MusicDetails}:${id}`,

  /**
   * Retrieves cached music details.
   *
   * @remarks Returns `null` on cache miss; does not throw when the backing store is empty.
   * @param id - Internal music identifier
   * @returns Cached {@link MusicDetails} or `null` when missing
   * @throws Does not throw under normal cache miss conditions
   * @see {@link musicCache.set} for storing payloads
   * @example
   * ```typescript
   * const details = await musicCache.get(42)
   * if (details) console.log(details.title)
   * ```
   */
  get: async (id: number): Promise<MusicDetails | null> => {
    const cacheKey = musicCache.key(id)
    return await cacheGet<MusicDetails>(cacheKey)
  },

  /**
   * Stores music details in the cache.
   *
   * @remarks Uses {@link CacheTtl.Medium} so detail payloads expire sooner than long-lived
   * list caches but remain warm across repeated page views.
   * @param id - Internal music identifier
   * @param details - Serialized music detail payload
   * @returns Resolves when the value is persisted
   * @throws May propagate cache backend write failures
   * @see {@link musicCache.get} for retrieval
   * @example
   * ```typescript
   * await musicCache.set(42, details)
   * ```
   */
  set: async (id: number, details: MusicDetails): Promise<void> => {
    const cacheKey = musicCache.key(id)
    await cacheSet(cacheKey, details, { ttlSeconds: CacheTtl.Medium })
  },
}
