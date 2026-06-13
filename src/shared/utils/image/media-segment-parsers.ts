/**
 * Segment-level parsers for semantic media paths.
 *
 * @module shared/utils/image/media-segment-parsers
 * @remarks Convert trailing URL segments into intermediate {@link ParsedMediaSegments} for the
 * type-first, slug-then-type, and raw-entity (music/episode) layouts.
 * @see {@link parseMediaPath}
 */

import type { MediaSize, MediaType } from '@domains/media/types/media-types'
import { MediaSize as MediaSizeEnum } from '@domains/media/types/media-types'
import {
  isSupportedMediaSize,
  isValidMediaType,
} from '@utils/image/media-path-guards'

/** Intermediate parse result before building {@link SemanticMediaPath}. */
export type ParsedMediaSegments = {
  /** Resolved media type (poster, banner, etc.). */
  type: MediaType
  /** Resolved size variant. */
  size: MediaSize
  /** 1-based asset index within the entity's media list. */
  index: number
  /** Optional slug segment when using slug-then-type layout. */
  slug?: string
  /** Version label for music/episode assets. */
  version?: string
  /** Resolution label for music/episode assets. */
  resolution?: string
}

/** Size and index pair extracted from trailing path segments. */
type SizeAndIndex = {
  size: MediaSize
  index: number
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
export const parseTypeFirstPattern = (
  third?: string,
  fourth?: string,
  fifth?: string,
  entity?: string
): ParsedMediaSegments | null => {
  if (!isValidMediaType(third, entity ?? '')) {
    return null
  }

  const { size, index } = parseSizeAndIndex(fourth, fifth)
  return { type: third as MediaType, size, index }
}

/**
 * Parses `{entity}/{id}/{slug}/{type}/...` layout.
 *
 * @internal
 */
export const parseSlugThenTypePattern = (
  third?: string,
  fourth?: string,
  fifth?: string,
  sixth?: string,
  entity?: string
): ParsedMediaSegments | null => {
  if (!third || !isValidMediaType(fourth, entity ?? '')) {
    return null
  }

  const { size, index } = parseSizeAndIndex(fifth, sixth)
  return { type: fourth as MediaType, size, index, slug: third }
}

/**
 * Parses `{entity}/{id}/{type}/{version?}/{resolution?}` layout for raw entities (music/episode).
 *
 * @internal
 */
export const parseRawEntityPattern = (
  third?: string,
  fourth?: string,
  fifth?: string
): ParsedMediaSegments | null => {
  if (!isValidMediaType(third, 'music')) {
    return null
  }

  return {
    type: third as MediaType,
    size: MediaSizeEnum.DEFAULT,
    index: 1,
    version: fourth,
    resolution: fifth,
  }
}
