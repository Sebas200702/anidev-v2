/**
 * @module @domains/media/cache/media-cache
 * @remarks Read-through cache facade for optimized media image buffers. Composes deterministic
 * key construction ({@link media-cache-keys}), base64 serialization
 * ({@link media-cache-serialization}), and the cache store ({@link media-cache-store}).
 *
 * Used by {@link mediaService.optimizeMedia} and {@link mediaService.optimizeMediaByUrl} via
 * {@link withCache}. TTL defaults to {@link CacheTtl.Long} because optimized bytes are expensive
 * to recompute.
 *
 * @see {@link mediaService} for the read-through consumer
 * @example
 * ```typescript
 * import { mediaCache } from '@domains/media/cache/media-cache'
 *
 * const hit = await mediaCache.get(parsedPath, { width: 400 })
 * if (!hit) await mediaCache.set(parsedPath, options, optimized)
 * ```
 */
import type { OptimizeOptions } from '@utils/image/optimize-util'
import type {
  OptimizedMedia,
  SemanticMediaPath,
} from '@domains/media/types/media-types'
import { buildKey, buildRawKey, buildRawMetaKey } from '@domains/media/cache/media-cache-keys'
import {
  readCachedMedia,
  writeCachedMedia,
  readRawMeta,
  writeRawMeta,
  type RawMeta,
} from '@domains/media/cache/media-cache-store'

/**
 * Cache helpers for optimized and raw media payloads. Each member delegates to a focused module;
 * key builders are exposed for {@link withCache} integration.
 */
export const mediaCache = {
  /** Builds a cache key for a semantic media path. @see {@link buildKey} */
  key(params: SemanticMediaPath, options: OptimizeOptions) {
    return buildKey(params, options)
  },

  /** Builds a cache key for a direct image URL. @see {@link buildKey} */
  keyFromUrl(imageUrl: string, options: OptimizeOptions) {
    return buildKey(imageUrl, options)
  },

  /** Builds a cache key for a raw (non-optimized) media path. @see {@link buildRawKey} */
  rawKey(params: SemanticMediaPath) {
    return buildRawKey(params)
  },

  /** Retrieves cached optimized media for a semantic path. */
  async get(
    params: SemanticMediaPath,
    options: OptimizeOptions
  ): Promise<OptimizedMedia | null> {
    return readCachedMedia(this.key(params, options))
  },

  /** Retrieves cached optimized media for a direct image URL. */
  async getFromUrl(
    imageUrl: string,
    options: OptimizeOptions
  ): Promise<OptimizedMedia | null> {
    return readCachedMedia(this.keyFromUrl(imageUrl, options))
  },

  /** Stores optimized media for a semantic path. */
  async set(
    params: SemanticMediaPath,
    options: OptimizeOptions,
    image: OptimizedMedia
  ): Promise<void> {
    await writeCachedMedia(this.key(params, options), image)
  },

  /** Stores optimized media for a direct image URL. */
  async setFromUrl(
    imageUrl: string,
    options: OptimizeOptions,
    image: OptimizedMedia
  ): Promise<void> {
    await writeCachedMedia(this.keyFromUrl(imageUrl, options), image)
  },

  /** Retrieves cached raw media bytes for a semantic path. */
  async getRaw(params: SemanticMediaPath): Promise<OptimizedMedia | null> {
    return readCachedMedia(this.rawKey(params))
  },

  /** Stores raw media bytes for a semantic path. */
  async setRaw(
    params: SemanticMediaPath,
    media: OptimizedMedia
  ): Promise<void> {
    await writeCachedMedia(this.rawKey(params), media)
  },

  /** Builds a cache key for raw media metadata. */
  rawMetaKey(params: SemanticMediaPath) {
    return buildRawMetaKey(params)
  },

  /** Retrieves cached raw media metadata. */
  async getRawMeta(params: SemanticMediaPath): Promise<RawMeta | null> {
    return readRawMeta(this.rawMetaKey(params))
  },

  /** Stores raw media metadata. */
  async setRawMeta(params: SemanticMediaPath, meta: RawMeta): Promise<void> {
    await writeRawMeta(this.rawMetaKey(params), meta)
  },
}

/**
 * Backward-compatible alias for legacy image cache imports.
 *
 * @remarks Prefer {@link mediaCache} in new code; both names reference the same object.
 * @see {@link mediaCache}
 */
export { mediaCache as imageCache }
