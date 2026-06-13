/**
 * @module @domains/media/services/media-service
 * @remarks Application service facade for media resolution and image optimization. Composes the
 * focused service modules into a single object covering semantic path parsing, repository-backed
 * asset lookup, remote fetching, buffer optimization, and read-through caching.
 *
 * Pipeline summary for semantic paths:
 * 1. {@link parseMediaPath} converts route segments into {@link SemanticMediaPath}
 * 2. {@link resolveMedia} loads, filters, and selects a single asset
 * 3. {@link fetchImageBuffer} downloads the chosen `src` URL
 * 4. {@link optimizeMediaImageBuffer} transforms bytes (resize, format, quality)
 * 5. {@link mediaCache} stores results keyed by path/URL plus optimization options
 *
 * @see {@link resolve-media-service} for asset resolution
 * @see {@link optimize-media-service} for semantic-path optimization
 * @see {@link optimize-media-url-service} for direct-URL optimization
 * @see {@link fetch-raw-media-service} for raw byte delivery
 * @example
 * ```typescript
 * import { mediaService } from '@domains/media/services/media-service'
 *
 * const params = mediaService.parsePath('anime/5114/poster/large')
 * const asset = await mediaService.resolveMedia(params, 'myanimelist')
 * const optimized = await mediaService.optimizeMedia(params, { width: 400, quality: 75 })
 * ```
 */
import { parseMediaPath } from '@utils/image/parse-media-type-util'
import { resolveMedia } from '@domains/media/services/resolve-media-service'
import { fetchImageBuffer } from '@domains/media/services/fetch-image-buffer-service'
import { optimizeMedia } from '@domains/media/services/optimize-media-service'
import { optimizeMediaByUrl } from '@domains/media/services/optimize-media-url-service'
import { fetchRawMedia } from '@domains/media/services/fetch-raw-media-service'

/**
 * Aggregated media service exposing path parsing, asset resolution, optimization, and raw
 * delivery. Each member delegates to a focused service module; aliases preserve the legacy
 * public surface.
 *
 * @see {@link resolveMedia}, {@link optimizeMedia}, {@link optimizeMediaByUrl},
 * {@link fetchRawMedia}, {@link fetchImageBuffer}
 */
export const mediaService = {
  /** Parses a semantic media route path. @see {@link parseMediaPath} */
  parsePath: parseMediaPath,

  /** Resolves the best matching asset for a path. @see {@link resolveMedia} */
  resolveMedia,

  /** Alias for {@link resolveMedia}. */
  getEntityMedia: resolveMedia,

  /** Resolves and optimizes media for a path with caching. @see {@link optimizeMedia} */
  optimizeMedia,

  /** Alias for {@link optimizeMedia}. */
  optimizeEntityMedia: optimizeMedia,

  /** Resolves and fetches raw media bytes with fs caching. @see {@link fetchRawMedia} */
  fetchRawMedia,

  /** Optimizes a direct image URL with caching. @see {@link optimizeMediaByUrl} */
  optimizeMediaByUrl,

  /** Alias for {@link optimizeMediaByUrl}. */
  optimizeAndCacheImage: optimizeMediaByUrl,

  /** Downloads and validates an image URL. @see {@link fetchImageBuffer} */
  fetchImageBuffer,
}
