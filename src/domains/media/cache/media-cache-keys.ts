/**
 * @module @domains/media/cache/media-cache-keys
 * @remarks Builds deterministic cache keys from semantic media paths or normalized source URLs
 * combined with optimization options, so distinct transform requests never collide.
 */
import type { OptimizeOptions } from '@utils/image/optimize-util'
import type { SemanticMediaPath } from '@domains/media/types/media-types'

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
 * @example
 * ```typescript
 * buildKey(
 *   { entityType: MediaEntity.ANIME, entityId: 5114, mediaType: MediaType.POSTER, mediaSize: MediaSize.LARGE },
 *   { width: 400, quality: 75, format: 'webp' }
 * )
 * // "optimized:anime:5114:poster:large:1:w400:q75:fwebp:s"
 * ```
 */
export const buildKey = (
  params: SemanticMediaPath | string,
  options: OptimizeOptions
): string => {
  if (typeof params === 'string') {
    return `optimized:url:${params}:w${options.width ?? 'auto'}:q${options.quality ?? 'auto'}:f${options.format ?? 'webp'}:s${options.source ?? ''}`
  }

  return `optimized:${params.entityType}:${params.entityId}:${params.mediaType}:${params.mediaSize}:${params.mediaId ?? 1}:w${options.width ?? 'auto'}:q${options.quality ?? 'auto'}:f${options.format ?? 'webp'}:s${options.source ?? ''}`
}

/**
 * Builds a deterministic cache key for raw (non-optimized) media assets.
 *
 * @remarks Uses a `raw:` prefix and omits optimization parameters since raw assets are served
 * as-is without transformation.
 * @param params - Semantic media path
 * @returns Cache key string
 * @example
 * ```typescript
 * buildRawKey({ entityType: MediaEntity.EPISODE, entityId: 1, mediaType: 'op', mediaSize: MediaSize.DEFAULT })
 * // "raw:episode:1:op:default:1"
 * ```
 */
export const buildRawKey = (params: SemanticMediaPath): string => {
  return `raw:${params.entityType}:${params.entityId}:${params.mediaType}:${params.mediaSize}:${params.mediaId ?? 1}`
}
