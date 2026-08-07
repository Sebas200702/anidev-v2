/**
 * Types for the semantic media-path segment parsers.
 *
 * @module shared/utils/image/media-segment-parsers-types
 * @remarks
 * Consumed by {@link module:shared/utils/image/media-segment-parsers} as the
 * intermediate parse result before building {@link SemanticMediaPath}.
 *
 * @see {@link parseMediaPath} for the full path parser
 * @see {@link module:domains/media/types/media-types} for the media enums
 */

import type { MediaSize, MediaType } from '@media/types/media-types'

/** Intermediate parse result before building {@link SemanticMediaPath}. */
export interface ParsedMediaSegments {
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
export interface SizeAndIndex {
  size: MediaSize
  index: number
}
