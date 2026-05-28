/**
 * @module @domains/media/services/media-service
 * @remarks Application service for media resolution and image optimization. Orchestrates
 * semantic path parsing, repository-backed asset lookup, remote fetching, buffer optimization,
 * and read-through caching.
 */
import { withCache } from '@lib/cache'
import { ErrorCodes } from '@shared/errors/codes'
import { InfraError } from '@shared/errors/app-error'
import { normalizeImageUrl } from '@utils/image/normalize-image-url-util'
import { resolveMediaAssets } from '@utils/image/normalize-media-util'
import {
  normalizeOptimizeOptions,
  type OptimizeOptions,
} from '@utils/image/optimize-util'
import { mediaServiceConfig } from '@domains/media/config'
import { parseMediaPath } from '@utils/image/parse-media-type-util'
import { mediaCache } from '@domains/media/cache/media-cache'
import {
  mapFilteredMediaAssets,
  mapIndexedMediaAsset,
} from '@domains/media/mappers/media-assets-mapper'
import { optimizeMediaImageBuffer } from '@domains/media/services/image-optimizer-service'
import { fetchMediaAsset } from '@domains/media/services/media-fetch-service'
import type {
  MediaAsset,
  OptimizedMedia,
  SemanticMediaPath,
} from '@domains/media/types/media-types'

/**
 * Resolves entity media assets and serves optimized image bytes.
 *
 * @remarks Pipeline summary for semantic paths:
 * 1. {@link parseMediaPath} converts route segments into {@link SemanticMediaPath}
 * 2. {@link resolveMediaAssets} loads candidate assets from entity repositories
 * 3. {@link mapFilteredMediaAssets} filters by size and optional source host
 * 4. {@link mapIndexedMediaAsset} selects a single asset by 1-based index
 * 5. {@link fetchMediaAsset} downloads the chosen `src` URL
 * 6. {@link optimizeMediaImageBuffer} transforms bytes (resize, format, quality)
 * 7. {@link mediaCache} stores results keyed by path/URL plus optimization options
 * @see {@link buildMediaUrl} for constructing semantic media URLs in page mappers
 * @see {@link mediaRequestSchema} for route validation
 * @example
 * ```typescript
 * import { mediaService } from '@domains/media/services/media-service'
 *
 * const params = mediaService.parsePath('anime/5114/poster/large')
 * const asset = await mediaService.resolveMedia(params, 'myanimelist')
 * const optimized = await mediaService.optimizeMedia(params, { width: 400, quality: 75 })
 * ```
 */
export const mediaService = {
  /**
   * Parses a semantic media route path into structured segments.
   *
   * @remarks Re-exports {@link parseMediaPath}. Returns `null` when the path does not match
   * supported entity/type/size patterns.
   * @param path - Catch-all media route path without leading `/media/`
   * @returns Parsed {@link SemanticMediaPath} or `null` when invalid
   * @throws Does not throw; returns `null` for invalid paths
   * @see {@link SemanticMediaPath} for the parsed shape
   * @example
   * ```typescript
   * const params = mediaService.parsePath('anime/5114/poster/large/2')
   * // { entityType: 'anime', entityId: 5114, mediaType: 'poster', mediaSize: 'large', mediaId: 2 }
   * ```
   */
  parsePath: parseMediaPath,

  /**
   * Resolves the best matching media asset for a semantic path.
   *
   * @remarks Loads assets via {@link resolveMediaAssets}, filters by size and optional source,
   * then selects by index. Returns a placeholder asset when no match is found.
   * @param params - Parsed media path segments
   * @param source - Optional upstream source filter applied before index selection
   * @returns Selected {@link MediaAsset} or a placeholder when none match
   * @throws May propagate repository or asset resolution failures
   * @see {@link mediaServiceConfig.defaultPlaceholderUrl} for fallback `src`
   * @example
   * ```typescript
   * const asset = await mediaService.resolveMedia(parsedPath, 'myanimelist')
   * console.log(asset.src)
   * ```
   */
  async resolveMedia(
    params: SemanticMediaPath,
    source?: OptimizeOptions['source']
  ): Promise<MediaAsset> {
    const assets = await resolveMediaAssets(params)
    const sourceFilteredAssets = mapFilteredMediaAssets({
      assets,
      mediaSize: params.mediaSize,
      source,
    })
    const asset = mapIndexedMediaAsset(sourceFilteredAssets, params.mediaId)

    if (!asset) {
      return {
        id: 0,
        mediaType: params.mediaType,
        src: mediaServiceConfig.defaultPlaceholderUrl,
        size: params.mediaSize,
      }
    }

    return asset
  },

  /**
   * Alias for {@link mediaService.resolveMedia}.
   *
   * @param params - Parsed media path segments
   * @param source - Optional upstream source filter
   * @returns Selected {@link MediaAsset} or placeholder
   * @throws May propagate repository or asset resolution failures
   * @see {@link mediaService.resolveMedia}
   * @example
   * ```typescript
   * const asset = await mediaService.getEntityMedia(parsedPath)
   * ```
   */
  async getEntityMedia(
    params: SemanticMediaPath,
    source?: OptimizeOptions['source']
  ): Promise<MediaAsset> {
    return this.resolveMedia(params, source)
  },

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
   * const optimized = await mediaService.optimizeMedia(parsedPath, {
   *   width: 400,
   *   quality: 75,
   *   format: 'webp',
   *   source: 'myanimelist',
   * })
   * ```
   */
  async optimizeMedia(
    params: SemanticMediaPath | null,
    options: OptimizeOptions = {}
  ): Promise<OptimizedMedia> {
    if (!params) {
      throw new InfraError(
        ErrorCodes.INVALID_IMAGE_PATH,
        'Invalid media path',
        { params }
      )
    }

    const normalizedOptions = normalizeOptimizeOptions(options)
    const resolvedParams = params

    return withCache({
      key: mediaCache.key(resolvedParams, normalizedOptions),
      getCache: () => mediaCache.get(resolvedParams, normalizedOptions),
      setCache: (_, value) =>
        mediaCache.set(resolvedParams, normalizedOptions, value),
      compute: async () => {
        const media = await this.resolveMedia(
          resolvedParams,
          normalizedOptions.source
        )
        const buffer = await this.fetchImageBuffer(media.src)
        return optimizeMediaImageBuffer(buffer, normalizedOptions)
      },
    })
  },

  /**
   * Alias for {@link mediaService.optimizeMedia}.
   *
   * @param params - Parsed media path segments, or `null` when invalid
   * @param options - Optimization options
   * @returns Optimized image buffer and MIME type
   * @throws {InfraError} When the path is invalid or fetching fails
   * @see {@link mediaService.optimizeMedia}
   * @example
   * ```typescript
   * const optimized = await mediaService.optimizeEntityMedia(parsedPath, { width: 200 })
   * ```
   */
  async optimizeEntityMedia(
    params: SemanticMediaPath | null,
    options: OptimizeOptions = {}
  ): Promise<OptimizedMedia> {
    return this.optimizeMedia(params, options)
  },

  /**
   * Alias for {@link mediaService.optimizeMediaByUrl}.
   *
   * @param imageUrl - Absolute source image URL
   * @param options - Optimization options
   * @returns Optimized image buffer and MIME type
   * @throws {InfraError} When fetching or optimization fails
   * @see {@link mediaService.optimizeMediaByUrl}
   * @example
   * ```typescript
   * const optimized = await mediaService.optimizeAndCacheImage(imageUrl, { width: 300 })
   * ```
   */
  async optimizeAndCacheImage(
    imageUrl: string,
    options: OptimizeOptions = {}
  ): Promise<OptimizedMedia> {
    return this.optimizeMediaByUrl(imageUrl, options)
  },

  /**
   * Optimizes a direct image URL with caching.
   *
   * @remarks Normalizes the URL via {@link normalizeImageUrl} before fetch and cache key
   * construction. Uses {@link mediaCache.keyFromUrl} for deterministic URL-based keys.
   * @param imageUrl - Absolute source image URL
   * @param options - Optimization options
   * @returns Optimized image buffer and MIME type
   * @throws {InfraError} When fetching or optimization fails
   * @see {@link mediaService.optimizeMedia} for semantic path optimization
   * @example
   * ```typescript
   * const optimized = await mediaService.optimizeMediaByUrl(
   *   'https://cdn.myanimelist.net/images/anime/1.jpg',
   *   { width: 400, quality: 80 }
   * )
   * ```
   */
  async optimizeMediaByUrl(
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
        const buffer = await this.fetchImageBuffer(normalizedImageUrl)
        return optimizeMediaImageBuffer(buffer, normalizedOptions)
      },
    })
  },

  /**
   * Downloads an image URL and validates that the response is an image.
   *
   * @remarks Uses {@link fetchMediaAsset} with an image-focused Accept header, then verifies
   * the returned MIME type starts with `image/`.
   * @param imageUrl - Absolute source image URL
   * @returns Raw image bytes ready for optimization
   * @throws {InfraError} When fetching fails or the resource is not an image
   * @see {@link optimizeMediaImageBuffer} for the next pipeline stage
   * @example
   * ```typescript
   * const buffer = await mediaService.fetchImageBuffer(asset.src)
   * const optimized = optimizeMediaImageBuffer(buffer, { width: 400 })
   * ```
   */
  async fetchImageBuffer(imageUrl: string): Promise<Buffer> {
    const normalizedImageUrl = normalizeImageUrl(imageUrl)
    const media = await fetchMediaAsset(normalizedImageUrl, {
      accept: 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
    })

    if (!media.mimeType.startsWith('image/')) {
      throw new InfraError(
        ErrorCodes.EXTERNAL_API_ERROR,
        'Fetched resource is not an image',
        { url: normalizedImageUrl, mimeType: media.mimeType }
      )
    }

    return media.buffer
  },
}
