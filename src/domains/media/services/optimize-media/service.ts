/**
 * @module domains/media/services/optimize-media/service
 * @remarks Resolves and optimizes media for a semantic path with read-through caching.
 * Full pipeline: resolve asset → fetch buffer → optimize → cache.
 */
import { withCache } from '@lib/cache'
import { ErrorCodes } from '@shared/errors/codes'
import { InfraError } from '@shared/errors/app-error'
import {
  normalizeOptimizeOptions,
  type OptimizeOptions,
} from '@utils/image/optimize-util'
import { mediaServiceConfig } from '@media/config'
import { mediaCache } from '@media/cache/media-cache'
import { optimizeMediaImageBuffer } from '@media/services/image-optimizer'
import { resolveMedia } from '@media/services/resolve-media'
import { fetchImageBuffer } from '@media/services/fetch-image-buffer'
import type {
  OptimizedMedia,
  SemanticMediaPath,
} from '@media/types/media-types'

/**
 * Resolves and optimizes media for a semantic path with caching.
 *
 * @remarks Full pipeline: resolve asset → fetch buffer → optimize → cache. Uses
 * {@link withCache} with {@link mediaCache.key} for read-through caching.
 * @param params - Parsed media path segments, or `null` when invalid
 * @param options - Optimization options (width, quality, format, source)
 * @returns Optimized image buffer and MIME type
 * @throws {InfraError} When the path is invalid or fetching/optimization fails
 * @see {@link mediaCache} for cache key format and TTL
 * @example
 * ```typescript
 * const optimized = await optimizeMedia(parsedPath, {
 *   width: 400,
 *   quality: 75,
 *   format: 'webp',
 *   source: 'myanimelist',
 * })
 * ```
 */
export const optimizeMedia = async (
  params: SemanticMediaPath | null,
  options: OptimizeOptions = {}
): Promise<OptimizedMedia> => {
  if (!params) {
    throw new InfraError(ErrorCodes.INVALID_IMAGE_PATH, 'Invalid media path', {
      params,
    })
  }

  const normalizedOptions = normalizeOptimizeOptions(options)
  const resolvedParams = params
  let isPlaceholder = false

  return withCache({
    key: mediaCache.key(resolvedParams, normalizedOptions),
    getCache: () => mediaCache.get(resolvedParams, normalizedOptions),
    setCache: (_, value) =>
      mediaCache.set(resolvedParams, normalizedOptions, value),
    compute: async () => {
      const media = await resolveMedia(resolvedParams, normalizedOptions.source)
      isPlaceholder = media.src === mediaServiceConfig.defaultPlaceholderUrl
      const buffer = await fetchImageBuffer(media.src)
      return optimizeMediaImageBuffer(buffer, normalizedOptions)
    },
    shouldCache: () => !isPlaceholder,
  })
}
