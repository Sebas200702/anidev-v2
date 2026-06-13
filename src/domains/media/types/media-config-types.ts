/**
 * @module @domains/media/types/media-config-types
 * @remarks Runtime configuration types for media resolution/optimization and the cache key
 * options alias.
 */
import type { ImageFormat, OptimizeOptions } from '@utils/image/optimize-util'
import type { MediaEntity, MediaType } from '@domains/media/types/media-enums'

/**
 * Runtime defaults for media resolution and optimization.
 *
 * @remarks Defined in {@link mediaServiceConfig} and referenced by {@link mediaService.resolveMedia}
 * for placeholder fallbacks and supported entity/type allowlists.
 * @see {@link mediaServiceConfig}
 * @example
 * ```typescript
 * const config: MediaServiceConfig = mediaServiceConfig
 * console.log(config.defaultQuality, config.defaultFormat)
 * ```
 */
export interface MediaServiceConfig {
  /** Default JPEG/WebP quality when query param `q` is omitted. */
  defaultQuality: number
  /** Default output format when not specified in optimization options. */
  defaultFormat: ImageFormat
  /** Fallback image URL returned when no matching asset exists. */
  defaultPlaceholderUrl: string
  /** Media types supported by semantic path resolution. */
  supportedMediaTypes: MediaType[]
  /** Entity types supported by semantic path resolution. */
  supportedEntities: MediaEntity[]
}

/**
 * Optimization options used when building media cache keys.
 *
 * @remarks Alias of {@link OptimizeOptions}; width, quality, format, and source all participate
 * in {@link mediaCache} key generation so distinct transforms produce distinct cache entries.
 * @see {@link mediaCache.key}
 * @example
 * ```typescript
 * const options: MediaCacheKeyOptions = { width: 400, quality: 75, format: 'webp' }
 * const key = mediaCache.key(parsedPath, options)
 * ```
 */
export type MediaCacheKeyOptions = OptimizeOptions
