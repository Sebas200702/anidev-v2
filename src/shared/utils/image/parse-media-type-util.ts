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
 * Segment-level parsing lives in {@link media-segment-parsers}; validation guards in
 * {@link media-path-guards}.
 *
 * @see {@link parseMediaPath}
 * @see {@link mediaServiceConfig.supportedEntities} / `supportedMediaTypes`
 */

import { ErrorCodes } from '@shared/errors/codes'
import { DomainError } from '@shared/errors/app-error'
import type { SemanticMediaPath } from '@domains/media/types/media-types'
import { RAW_ENTITIES, isSupportedEntity } from '@utils/image/media-path-guards'
import {
  parseRawEntityPattern,
  parseSlugThenTypePattern,
  parseTypeFirstPattern,
} from '@utils/image/media-segment-parsers'

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

  if (RAW_ENTITIES.has(entity)) {
    const parsed = parseRawEntityPattern(third, fourth, fifth)
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
      version: parsed.version,
      resolution: parsed.resolution,
    }
  }

  const parsed =
    parseTypeFirstPattern(third, fourth, fifth, entity) ??
    parseSlugThenTypePattern(third, fourth, fifth, sixth, entity)

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
