/**
 * @module @domains/media/config
 * @remarks Default configuration for media resolution, placeholder fallbacks, and image
 * optimization defaults used across the media delivery pipeline.
 */
import { config } from '@config/index'
import {
  MediaEntity,
  MediaType,
  type MediaServiceConfig,
} from '@domains/media/types/media-types'

/**
 * Shared defaults for media lookup, placeholders, and supported assets.
 *
 * @remarks Consumed by {@link mediaService.resolveMedia} for placeholder URLs and by
 * {@link normalizeOptimizeOptions} callers for default quality/format baselines.
 * @see {@link MediaServiceConfig} for the typed configuration shape
 * @see {@link mediaService} for runtime usage
 * @example
 * ```typescript
 * import { mediaServiceConfig } from '@domains/media/config'
 *
 * console.log(mediaServiceConfig.defaultQuality) // 75
 * console.log(mediaServiceConfig.defaultPlaceholderUrl)
 * ```
 */
export const mediaServiceConfig: MediaServiceConfig = {
  defaultQuality: 75,
  defaultFormat: 'webp',
  defaultPlaceholderUrl: `${config.baseUrl}/placeholder.webp`,
  supportedMediaTypes: [
    MediaType.POSTER,
    MediaType.BANNER,
    MediaType.BACKGROUND,
    MediaType.CLEARART,
    MediaType.CLEARLOGO,
    MediaType.ICON,
  ],
  supportedEntities: [
    MediaEntity.ANIME,
    MediaEntity.CHARACTER,
    MediaEntity.STAFF,
    MediaEntity.STUDIO,
    MediaEntity.EPISODE,
    MediaEntity.MUSIC,
  ],
}
