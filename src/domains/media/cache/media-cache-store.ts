/**
 * @module @domains/media/cache/media-cache-store
 * @remarks Low-level read/write helpers over the shared cache backend for serialized media
 * payloads. Key construction is the caller's responsibility (see {@link media-cache-keys}).
 */
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import {
  serializeImage,
  deserializeImage,
  type CachedOptimizedMedia,
} from '@domains/media/cache/media-cache-serialization'
import type { OptimizedMedia } from '@domains/media/types/media-types'

/**
 * Reads and deserializes a cached media payload.
 *
 * @param cacheKey - Pre-built cache key
 * @returns Cached {@link OptimizedMedia} or `null` when missing or invalid
 * @throws Does not throw on cache miss
 * @see {@link writeCachedMedia} for the inverse operation
 * @example
 * ```typescript
 * const cached = await readCachedMedia(mediaCache.key(parsedPath, options))
 * ```
 */
export async function readCachedMedia(
  cacheKey: string
): Promise<OptimizedMedia | null> {
  const cached = await cacheGet<CachedOptimizedMedia | string>(cacheKey)

  return deserializeImage(cached)
}

/**
 * Serializes and writes a media payload under the given key.
 *
 * @remarks TTL defaults to {@link CacheTtl.Long} because optimized bytes are expensive to
 * recompute.
 * @param cacheKey - Pre-built cache key
 * @param image - Optimized image to cache
 * @returns Resolves when the value is persisted
 * @throws May propagate cache backend write failures
 * @see {@link readCachedMedia} for retrieval
 * @example
 * ```typescript
 * await writeCachedMedia(mediaCache.key(parsedPath, options), optimized)
 * ```
 */
export async function writeCachedMedia(
  cacheKey: string,
  image: OptimizedMedia
): Promise<void> {
  await cacheSet(cacheKey, serializeImage(image), {
    ttlSeconds: CacheTtl.Long,
  })
}
