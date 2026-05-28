/**
 * Parses semantic media URL path segments into typed {@link SemanticMediaPath} descriptors.
 *
 * @module shared/utils/image/parse-media-type-util
 * @remarks
 * Supports two layouts after `/{entity}/{id}/`:
 * - **Type-first**: `{mediaType}/{size?}/{index?}`
 * - **Slug-then-type**: `{slug}/{mediaType}/{size?}/{index?}`
 *
 * Segment count must be 3–6 (inclusive). Invalid counts or non-positive integer ids return `null`
 * without throwing. Unsupported entity or media type throws {@link DomainError} (`INVALID_IMAGE_PATH` → HTTP 400).
 *
 * @see {@link parseMediaPath}
 * @see {@link mediaServiceConfig.supportedEntities} / `supportedMediaTypes`
 */

import { ErrorCodes } from '@shared/errors/codes'
import { DomainError } from '@shared/errors/app-error'
import { mediaServiceConfig } from '@domains/media/config'
import type {
  MediaEntity,
  MediaSize,
  MediaType,
  SemanticMediaPath,
} from '@domains/media/types/media-types'
import { MediaSize as MediaSizeEnum } from '@domains/media/types/media-types'

/** Intermediate parse result before building {@link SemanticMediaPath}. */
type ParsedMediaSegments = {
  /** Resolved media type (poster, banner, etc.). */
  type: MediaType
  /** Resolved size variant. */
  size: MediaSize
  /** 1-based asset index within the entity's media list. */
  index: number
  /** Optional slug segment when using slug-then-type layout. */
  slug?: string
}

/** Size and index pair extracted from trailing path segments. */
type SizeAndIndex = {
  size: MediaSize
  index: number
}

/**
 * @param type - Raw third-or-fourth segment candidate
 * @returns `true` when the value is in {@link mediaServiceConfig.supportedMediaTypes}
 * @internal
 */
const isSupportedMediaType = (type: string): type is MediaType => {
  return mediaServiceConfig.supportedMediaTypes.includes(type as MediaType)
}

/**
 * @param entity - First path segment (e.g. `anime`, `character`)
 * @returns `true` when the value is in {@link mediaServiceConfig.supportedEntities}
 * @internal
 */
const isSupportedEntity = (entity: string): entity is MediaEntity => {
  return mediaServiceConfig.supportedEntities.includes(entity as MediaEntity)
}

/** Set of valid {@link MediaSize} enum string values for path parsing. */
const MEDIA_SIZES: Set<MediaSize> = new Set([
  MediaSizeEnum.DEFAULT,
  MediaSizeEnum.SMALL,
  MediaSizeEnum.LARGE,
])

/**
 * @param size - Raw segment that may be a media size keyword
 * @internal
 */
const isSupportedMediaSize = (size: string): size is MediaSize => {
  return MEDIA_SIZES.has(size as MediaSize)
}

/**
 * Parses a path segment into a positive integer media index, defaulting to 1.
 *
 * @param segment - Optional index segment from the URL
 * @returns Positive integer index, or `1` when missing or invalid
 * @internal
 */
const parseMediaIndex = (segment?: string): number => {
  const parsedIndex = Number(segment)
  return Number.isInteger(parsedIndex) && parsedIndex > 0 ? parsedIndex : 1
}

/**
 * Interprets one or two trailing segments as size and/or index.
 *
 * @param sizeOrIndexSegment - Either a size keyword or the index when size is omitted
 * @param indexSegment - Index when the previous segment was a size
 * @returns Resolved {@link SizeAndIndex}
 * @internal
 */
const parseSizeAndIndex = (
  sizeOrIndexSegment?: string,
  indexSegment?: string
): SizeAndIndex => {
  if (sizeOrIndexSegment && isSupportedMediaSize(sizeOrIndexSegment)) {
    return {
      size: sizeOrIndexSegment,
      index: parseMediaIndex(indexSegment),
    }
  }

  return {
    size: MediaSizeEnum.DEFAULT,
    index: parseMediaIndex(sizeOrIndexSegment),
  }
}

/**
 * Parses `{entity}/{id}/{type}/...` layout.
 *
 * @internal
 */
const parseTypeFirstPattern = (
  third?: string,
  fourth?: string,
  fifth?: string
): ParsedMediaSegments | null => {
  if (!third || !isSupportedMediaType(third)) {
    return null
  }

  const { size, index } = parseSizeAndIndex(fourth, fifth)
  return { type: third, size, index }
}

/**
 * Parses `{entity}/{id}/{slug}/{type}/...` layout.
 *
 * @internal
 */
const parseSlugThenTypePattern = (
  third?: string,
  fourth?: string,
  fifth?: string,
  sixth?: string
): ParsedMediaSegments | null => {
  if (!third || !fourth || !isSupportedMediaType(fourth)) {
    return null
  }

  const { size, index } = parseSizeAndIndex(fifth, sixth)
  return { type: fourth, size, index, slug: third }
}

/**
 * Parses a raw media path into a {@link SemanticMediaPath}.
 *
 * @param rawPath - URL path segment after the media route prefix (may include leading/trailing slashes)
 * @returns Parsed descriptor, or `null` when segment count is not 3–6 or `id` is not a positive integer
 * @throws {DomainError} With code `INVALID_IMAGE_PATH` when entity or media type is unsupported
 *
 * @remarks
 * **Returns `null` (no throw)**
 * - Fewer than 3 or more than 6 non-empty segments.
 * - `id` segment is not a positive integer.
 *
 * **Throws {@link DomainError}**
 * - Unknown `entity` (first segment).
 * - Segments do not match type-first or slug-then-type patterns (unsupported media type).
 *
 * @example
 * ```typescript
 * // anime/123/poster/small/2
 * parseMediaPath('anime/123/poster/small/2')
 * // { entityType: 'anime', entityId: 123, mediaType: 'poster', mediaSize: 'small', mediaId: 2 }
 *
 * parseMediaPath('invalid/0/x') // null (bad id)
 * ```
 *
 * @see {@link resolveMediaAssets}
 */
export const parseMediaPath = (rawPath: string): SemanticMediaPath | null => {
  const segments = rawPath.split('/').filter(Boolean)
  if (segments.length < 3 || segments.length > 6) {
    return null
  }

  const [entity, idSegment, third, fourth, fifth, sixth] = segments
  const id = Number(idSegment)
  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  if (!isSupportedEntity(entity)) {
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsupported entity in path',
      { rawPath }
    )
  }

  const parsed =
    parseTypeFirstPattern(third, fourth, fifth) ??
    parseSlugThenTypePattern(third, fourth, fifth, sixth)

  if (!parsed) {
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsupported media type in path',
      { rawPath }
    )
  }

  return {
    entityId: id,
    entityType: entity,
    mediaType: parsed.type,
    mediaSize: parsed.size,
    mediaId: parsed.index,
    slug: parsed.slug,
  }
}
