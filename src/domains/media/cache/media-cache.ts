/**
 * @module @domains/media/cache/media-cache
 * @remarks Read-through cache for optimized media image buffers. Serializes {@link OptimizedMedia}
 * payloads as base64 JSON for storage and builds deterministic keys from semantic paths or
 * normalized source URLs combined with optimization options.
 */
import { cacheGet, cacheSet } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import type { OptimizeOptions } from '@utils/image/optimize-util'
import type { OptimizedMedia, SemanticMediaPath } from '@domains/media/types/media-types'

type CachedOptimizedMedia = {
  buffer: string
  mimeType: string
}

/**
 * Serializes an optimized image for cache storage.
 *
 * @param image - Optimized image buffer and MIME type
 * @returns Base64-encoded cache payload
 * @throws Does not throw under normal conditions
 * @see {@link deserializeImage} for the inverse operation
 * @example
 * ```typescript
 * const payload = serializeImage({ buffer, mimeType: 'image/webp' })
 * ```
 */
const serializeImage = (image: OptimizedMedia): CachedOptimizedMedia => ({
  buffer: image.buffer.toString('base64'),
  mimeType: image.mimeType,
})

/**
 * Restores an optimized image from cache storage.
 *
 * @remarks Returns `null` when the payload is missing, malformed JSON, or missing required
 * fields. Invalid entries are treated as cache misses.
 * @param payload - Cached payload or raw JSON string
 * @returns Optimized image or `null` when invalid
 * @throws Does not throw; returns `null` on parse failures
 * @see {@link serializeImage} for the storage format
 * @example
 * ```typescript
 * const image = deserializeImage(cachedPayload)
 * if (image) res.setHeader('Content-Type', image.mimeType)
 * ```
 */
const deserializeImage = (
  payload: CachedOptimizedMedia | string | null
): OptimizedMedia | null => {
  if (!payload) return null

  let parsed: CachedOptimizedMedia

  try {
    parsed = typeof payload === 'string' ? JSON.parse(payload) : payload
  } catch {
    return null
  }

  if (!parsed?.buffer || !parsed?.mimeType) {
    return null
  }

  return {
    buffer: Buffer.from(parsed.buffer, 'base64'),
    mimeType: parsed.mimeType,
  }
}

/**
 * Builds a deterministic cache key for optimized media.
 *
 * @remarks Keys embed entity segments, media type/size/index, and optimization parameters
 * (`width`, `quality`, `format`, `source`) so distinct transform requests never collide.
 * URL-based keys use an `optimized:url:` prefix instead.
 * @param params - Semantic media path or raw image URL
 * @param options - Optimization options affecting output bytes
 * @returns Cache key string
 * @throws Does not throw
 * @see {@link mediaCache.key} for semantic path entry point
 * @see {@link mediaCache.keyFromUrl} for URL-based keys
 * @example
 * ```typescript
 * buildKey(
 *   { entityType: MediaEntity.ANIME, entityId: 5114, mediaType: MediaType.POSTER, mediaSize: MediaSize.LARGE },
 *   { width: 400, quality: 75, format: 'webp' }
 * )
 * // "optimized:anime:5114:poster:large:1:w400:q75:fwebp:s"
 * ```
 */
const buildKey = (
  params: SemanticMediaPath | string,
  options: OptimizeOptions
): string => {
  if (typeof params === 'string') {
    return `optimized:url:${params}:w${options.width ?? 'auto'}:q${options.quality ?? 'auto'}:f${options.format ?? 'webp'}:s${options.source ?? ''}`
  }

  return `optimized:${params.entityType}:${params.entityId}:${params.mediaType}:${params.mediaSize}:${params.mediaId ?? 1}:w${options.width ?? 'auto'}:q${options.quality ?? 'auto'}:f${options.format ?? 'webp'}:s${options.source ?? ''}`
}

/**
 * Cache helpers for optimized image payloads.
 *
 * @remarks Used by {@link mediaService.optimizeMedia} and {@link mediaService.optimizeMediaByUrl}
 * via {@link withCache}. TTL defaults to {@link CacheTtl.Long} because optimized bytes are
 * expensive to recompute.
 * @see {@link mediaService} for the read-through consumer
 * @example
 * ```typescript
 * import { mediaCache } from '@domains/media/cache/media-cache'
 *
 * const hit = await mediaCache.get(parsedPath, { width: 400 })
 * if (!hit) await mediaCache.set(parsedPath, options, optimized)
 * ```
 */
export const mediaCache = {
  /**
   * Builds a cache key for a semantic media path.
   *
   * @param params - Parsed media path segments
   * @param options - Optimization options
   * @returns Deterministic cache key string
   * @throws Does not throw
   * @see {@link buildKey} for key format details
   * @example
   * ```typescript
   * mediaCache.key(parsedPath, { width: 400, quality: 75 })
   * ```
   */
  key(params: SemanticMediaPath, options: OptimizeOptions) {
    return buildKey(params, options)
  },

  /**
   * Builds a cache key for a direct image URL.
   *
   * @param imageUrl - Normalized source image URL
   * @param options - Optimization options
   * @returns Deterministic cache key string
   * @throws Does not throw
   * @see {@link mediaCache.getFromUrl} for retrieval
   * @example
   * ```typescript
   * mediaCache.keyFromUrl('https://cdn.example.com/poster.jpg', { width: 200 })
   * ```
   */
  keyFromUrl(imageUrl: string, options: OptimizeOptions) {
    return buildKey(imageUrl, options)
  },

  /**
   * Retrieves cached optimized media for a semantic path.
   *
   * @param params - Parsed media path segments
   * @param options - Optimization options
   * @returns Cached {@link OptimizedMedia} or `null` when missing or invalid
   * @throws Does not throw on cache miss
   * @see {@link mediaCache.set} for storing optimized bytes
   * @example
   * ```typescript
   * const cached = await mediaCache.get(parsedPath, { width: 400 })
   * ```
   */
  async get(
    params: SemanticMediaPath,
    options: OptimizeOptions
  ): Promise<OptimizedMedia | null> {
    const cacheKey = this.key(params, options)
    const cached = await cacheGet<CachedOptimizedMedia | string>(cacheKey)

    return deserializeImage(cached)
  },

  /**
   * Retrieves cached optimized media for a direct image URL.
   *
   * @param imageUrl - Normalized source image URL
   * @param options - Optimization options
   * @returns Cached {@link OptimizedMedia} or `null` when missing or invalid
   * @throws Does not throw on cache miss
   * @see {@link mediaCache.setFromUrl} for storing URL-based results
   * @example
   * ```typescript
   * const cached = await mediaCache.getFromUrl(imageUrl, { quality: 80 })
   * ```
   */
  async getFromUrl(
    imageUrl: string,
    options: OptimizeOptions
  ): Promise<OptimizedMedia | null> {
    const cacheKey = this.keyFromUrl(imageUrl, options)
    const cached = await cacheGet<CachedOptimizedMedia | string>(cacheKey)

    return deserializeImage(cached)
  },

  /**
   * Stores optimized media for a semantic path.
   *
   * @param params - Parsed media path segments
   * @param options - Optimization options
   * @param image - Optimized image to cache
   * @returns Resolves when the value is persisted
   * @throws May propagate cache backend write failures
   * @see {@link mediaCache.get} for retrieval
   * @example
   * ```typescript
   * await mediaCache.set(parsedPath, options, optimized)
   * ```
   */
  async set(
    params: SemanticMediaPath,
    options: OptimizeOptions,
    image: OptimizedMedia
  ): Promise<void> {
    const cacheKey = this.key(params, options)

    await cacheSet(cacheKey, serializeImage(image), {
      ttlSeconds: CacheTtl.Long,
    })
  },

  /**
   * Stores optimized media for a direct image URL.
   *
   * @param imageUrl - Normalized source image URL
   * @param options - Optimization options
   * @param image - Optimized image to cache
   * @returns Resolves when the value is persisted
   * @throws May propagate cache backend write failures
   * @see {@link mediaCache.getFromUrl} for retrieval
   * @example
   * ```typescript
   * await mediaCache.setFromUrl(imageUrl, options, optimized)
   * ```
   */
  async setFromUrl(
    imageUrl: string,
    options: OptimizeOptions,
    image: OptimizedMedia
  ): Promise<void> {
    const cacheKey = this.keyFromUrl(imageUrl, options)

    await cacheSet(cacheKey, serializeImage(image), {
      ttlSeconds: CacheTtl.Long,
    })
  },
}

/**
 * Backward-compatible alias for legacy image cache imports.
 *
 * @remarks Prefer {@link mediaCache} in new code; both names reference the same object.
 * @see {@link mediaCache}
 * @example
 * ```typescript
 * import { imageCache } from '@domains/media/cache/media-cache'
 * await imageCache.get(parsedPath, options)
 * ```
 */
export { mediaCache as imageCache }
