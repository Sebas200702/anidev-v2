/**
 * @module @media/cache/media-cache-serialization
 * @remarks Serializes {@link OptimizedMedia} payloads as base64 JSON for cache storage and
 * restores them on read. Invalid or malformed payloads are treated as cache misses.
 */
import type { OptimizedMedia } from '@media/types/media-types'
import type { CachedOptimizedMedia } from './media-cache-serialization-types'

export type { CachedOptimizedMedia } from './media-cache-serialization-types'

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
export const serializeImage = (
  image: OptimizedMedia
): CachedOptimizedMedia => ({
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
export const deserializeImage = (
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
