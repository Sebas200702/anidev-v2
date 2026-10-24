/**
 * Type guards and constant sets for semantic media path parsing.
 *
 * @module domains/media/utils/image/media-path-guards
 * @remarks Validates entity, media-type, and size segments against
 * {@link mediaServiceConfig}. For `episode` and `music` entities the media type is free-text.
 * @see {@link parseMediaPath}
 */

import { mediaServiceConfig } from '@media/config'
import { STREAMED_ENTITY_IMAGE_TYPES } from '@media/constants'
import type {
  MediaEntity,
  MediaSize,
  MediaType,
} from '@media/types/media-types'
import { MediaSize as MediaSizeEnum } from '@media/types/media-types'

/** Entity types that use free-form version/resolution segments instead of size/index. */
export const RAW_ENTITIES = new Set(['episode', 'music'])

/** Set of valid {@link MediaSize} enum string values for path parsing. */
const MEDIA_SIZES: Set<MediaSize> = new Set([
  MediaSizeEnum.DEFAULT,
  MediaSizeEnum.SMALL,
  MediaSizeEnum.LARGE,
])

/**
 * @param type - Raw third-or-fourth segment candidate
 * @returns `true` when the value is in {@link mediaServiceConfig.supportedMediaTypes}
 * @internal
 */
export const isSupportedMediaType = (type: string): type is MediaType => {
  return mediaServiceConfig.supportedMediaTypes.includes(type as MediaType)
}

/**
 * @param entity - First path segment (e.g. `anime`, `character`)
 * @returns `true` when the value is in {@link mediaServiceConfig.supportedEntities}
 * @internal
 */
export const isSupportedEntity = (entity: string): entity is MediaEntity => {
  return mediaServiceConfig.supportedEntities.includes(entity as MediaEntity)
}

/**
 * @param size - Raw segment that may be a media size keyword
 * @internal
 */
export const isSupportedMediaSize = (size: string): size is MediaSize => {
  return MEDIA_SIZES.has(size as MediaSize)
}

/**
 * Determines if a media type string is acceptable for the given entity.
 *
 * @remarks For `episode` and `music` entities the media type is free-text, so any
 * non-empty string is accepted. For all other entities it must be in
 * {@link mediaServiceConfig.supportedMediaTypes}.
 * @internal
 */
export const isValidMediaType = (
  type: string | undefined,
  entity: string
): type is string => {
  if (!type) return false
  if (entity === 'episode' || entity === 'music') return true
  return isSupportedMediaType(type)
}

/**
 * Whether a parsed media path is proxied as a raw stream (video/audio).
 *
 * @param entity - Parsed entity type
 * @param mediaType - Parsed media type
 * @returns `true` for {@link RAW_ENTITIES} except image types such as episode
 * thumbnails, which use the optimize pipeline and its placeholder fallback
 *
 * @example
 * ```typescript
 * isStreamedMedia('episode', 'video') // true
 * isStreamedMedia('episode', 'thumbnail') // false
 * ```
 */
export const isStreamedMedia = (entity: string, mediaType: string): boolean =>
  RAW_ENTITIES.has(entity) && !STREAMED_ENTITY_IMAGE_TYPES.has(mediaType)
