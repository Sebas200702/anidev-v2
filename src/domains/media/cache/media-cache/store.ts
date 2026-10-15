/**
 * @module domains/media/cache/media-cache/store
 * @remarks Low-level read/write helpers for media payloads. Optimized bytes live
 * in the bounded local-disk LRU ({@link disk-store}); raw `src` metadata stays
 * in the shared Redis backend. Key construction is the caller's responsibility
 * (see {@link media-cache-keys}).
 */
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import { readOptimizedDisk, writeOptimizedDisk } from './disk-store'
import type { OptimizedMedia } from '@media/types/media-types'
import type { RawMeta } from './store.types'

export type { RawMeta } from './store.types'

/**
 * Reads a cached optimized payload from disk.
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
export const readCachedMedia = async (
  cacheKey: string
): Promise<OptimizedMedia | null> => {
  return readOptimizedDisk(cacheKey)
}

/**
 * Writes an optimized payload to the bounded disk LRU.
 *
 * @remarks Best-effort: disk failures degrade to a recompute on the next read
 * and never break the response.
 * @param cacheKey - Pre-built cache key
 * @param image - Optimized image to cache
 * @returns Resolves when the value is persisted
 * @see {@link readCachedMedia} for retrieval
 * @example
 * ```typescript
 * await writeCachedMedia(mediaCache.key(parsedPath, options), optimized)
 * ```
 */
export const writeCachedMedia = async (
  cacheKey: string,
  image: OptimizedMedia
): Promise<void> => {
  await writeOptimizedDisk(cacheKey, image)
}

export const readRawMeta = async (
  cacheKey: string
): Promise<RawMeta | null> => {
  return cacheGet<RawMeta>(cacheKey)
}

export const writeRawMeta = async (
  cacheKey: string,
  meta: RawMeta
): Promise<void> => {
  await cacheSet(cacheKey, meta, {
    ttlSeconds: CacheTtl.Medium,
  })
}
