/**
 * @module @media/cache/media-cache-serialization-types
 * @remarks Base64 JSON cache payload shape for serialized optimized media images.
 */

/** Base64-encoded cache payload for an optimized image. */
export interface CachedOptimizedMedia {
  buffer: string
  mimeType: string
}
