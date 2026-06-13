/**
 * @module @domains/media/services/optimize-media-url-service
 * @remarks Optimizes a direct image URL with read-through caching, bypassing semantic-path
 * resolution. Used for already-known absolute image URLs.
 */
import { withCache } from '@lib/cache'
import { normalizeImageUrl } from '@utils/image/normalize-image-url-util'
import {
  normalizeOptimizeOptions,
  type OptimizeOptions,
} from '@utils/image/optimize-util'
import { mediaCache } from '@domains/media/cache/media-cache'
import { optimizeMediaImageBuffer } from '@domains/media/services/image-optimizer-service'
import { fetchImageBuffer } from '@domains/media/services/fetch-image-buffer-service'
import type { OptimizedMedia } from '@domains/media/types/media-types'

/**
 * Optimizes a direct image URL with caching.
 *
 * @remarks Normalizes the URL via {@link normalizeImageUrl} before fetch and cache key
 * construction. Uses {@link mediaCache.keyFromUrl} for deterministic URL-based keys.
 * @param imageUrl - Absolute source image URL
 * @param options - Optimization options
 * @returns Optimized image buffer and MIME type
 * @throws {InfraError} When fetching or optimization fails
 * @see {@link optimizeMedia} for semantic path optimization
 * @example
 * ```typescript
 * const optimized = await optimizeMediaByUrl(
 *   'https://cdn.myanimelist.net/images/anime/1.jpg',
 *   { width: 400, quality: 80 }
 * )
 * ```
 */
export async function optimizeMediaByUrl(
  imageUrl: string,
  options: OptimizeOptions = {}
): Promise<OptimizedMedia> {
  const normalizedImageUrl = normalizeImageUrl(imageUrl)
  const normalizedOptions = normalizeOptimizeOptions(options)

  return withCache({
    key: mediaCache.keyFromUrl(normalizedImageUrl, normalizedOptions),
    getCache: () =>
      mediaCache.getFromUrl(normalizedImageUrl, normalizedOptions),
    setCache: (_, value) =>
      mediaCache.setFromUrl(normalizedImageUrl, normalizedOptions, value),
    compute: async () => {
      const buffer = await fetchImageBuffer(normalizedImageUrl)
      return optimizeMediaImageBuffer(buffer, normalizedOptions)
    },
  })
}
