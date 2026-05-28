/**
 * Normalizes external image URLs and applies configured placeholder fallbacks.
 *
 * @module shared/utils/image/normalize-image-url-util
 * @remarks
 * Used when rendering anime/character artwork from upstream APIs that may return empty or malformed URLs.
 * Does not validate URL structure or fetch reachability — only type, trim, and emptiness checks.
 *
 * @see {@link normalizeImageUrl}
 * @see `mediaServiceConfig.defaultPlaceholderUrl` — fallback asset
 */

import { mediaServiceConfig } from '@domains/media/config'

/**
 * Returns a trimmed image URL or the configured placeholder when input is missing or blank.
 *
 * @param imageUrl - Raw image URL from upstream data (`string`, `null`, or `undefined`)
 * @returns Non-empty trimmed URL, or {@link mediaServiceConfig.defaultPlaceholderUrl}
 *
 * @remarks
 * **Edge cases**
 * - Non-string types (`null`, `undefined`, numbers) → placeholder immediately.
 * - Whitespace-only strings after `trim()` → placeholder.
 * - Valid URLs with leading/trailing spaces → trimmed and returned.
 *
 * @example
 * ```typescript
 * normalizeImageUrl('  https://cdn.example/img.jpg  ')
 * // 'https://cdn.example/img.jpg'
 *
 * normalizeImageUrl(null)
 * // mediaServiceConfig.defaultPlaceholderUrl
 * ```
 */
export const normalizeImageUrl = (
  imageUrl: string | null | undefined
): string => {
  if (typeof imageUrl !== 'string') {
    return mediaServiceConfig.defaultPlaceholderUrl
  }

  const normalized = imageUrl.trim()

  return normalized.length > 0
    ? normalized
    : mediaServiceConfig.defaultPlaceholderUrl
}
