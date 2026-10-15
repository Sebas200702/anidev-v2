/**
 * Helpers for resolving, indexing, and sizing media assets for semantic media routes.
 *
 * @module shared/utils/image/normalize-media-util
 * @remarks
 * Works with {@link SemanticMediaPath} from the media domain and repository lookups by entity type.
 * Thrown {@link InfraError} with `INVALID_IMAGE_PATH` maps to HTTP 500 when not caught and rethrown as {@link DomainError}.
 *
 * @see {@link parseMediaPath} — produces `SemanticMediaPath` from URL segments
 * @see {@link normalizeMediaId} / {@link normalizeAssetSize}
 */

import { MediaSize } from '@media/types/media-types'

/**
 * Clamps a 1-based media index to the valid range `[1, total]`.
 *
 * @param mediaId - Requested media index; values below 1 fall back to 1
 * @param total - Total number of available assets for the entity (must be ≥ 1 for meaningful results)
 * @returns Integer index in `[1, total]`
 *
 * @remarks
 * **Edge cases**
 * - `undefined`, `0`, or negative `mediaId` → treated as `1`.
 * - `mediaId` greater than `total` → clamped to `total`.
 * - When `total` is 0, `Math.min(..., 0)` yields 0 (caller should avoid empty asset lists).
 *
 * @example
 * ```typescript
 * normalizeMediaId(99, 5) // 5
 * normalizeMediaId(undefined, 10) // 1
 * ```
 */
export const normalizeMediaId = (
  mediaId: number | undefined,
  total: number
): number => {
  const candidate = mediaId && mediaId > 0 ? mediaId : 1
  return Math.min(Math.max(candidate, 1), total)
}

/**
 * Normalizes a requested media size segment to a supported {@link MediaSize} enum value.
 *
 * @param size - Raw size segment from a media path (`'small'`, `'large'`, or other)
 * @returns `SMALL`, `LARGE`, or `DEFAULT` when unrecognized or `null`
 *
 * @remarks
 * Unknown strings and `null` map to `MediaSize.DEFAULT` (not an error).
 */
export const normalizeAssetSize = (size: string | null): MediaSize => {
  if (size === MediaSize.SMALL || size === MediaSize.LARGE) {
    return size
  }

  return MediaSize.DEFAULT
}
