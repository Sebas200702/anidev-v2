/**
 * Validates user-controlled values that may be rendered as navigation targets.
 *
 * @module shared/utils/navigable-url
 * @remarks
 * Accepts same-origin relative paths (single leading `/`, never `//`) and
 * absolute `http:`/`https:` URLs. Rejects `javascript:`, `data:`, `vbscript:`
 * and other dangerous schemes. Used by showcase controls, ServiceUnavailable,
 * and genre-link sinks.
 */

/**
 * Returns `true` when `value` is a safe navigation target.
 *
 * @param value - The candidate href
 * @returns `true` for safe relative/absolute http(s) URLs
 */
export const isNavigableUrl = (value: string): boolean => {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Returns the value when safe, otherwise `undefined`.
 *
 * @param value - The candidate href
 * @returns The safe value or `undefined`
 */
export const toNavigableUrl = (value: string): string | undefined =>
  isNavigableUrl(value) ? value : undefined
