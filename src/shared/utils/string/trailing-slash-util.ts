/**
 * Trailing-slash trimming without a backtracking-prone regex.
 *
 * @module shared/utils/string/trailing-slash-util
 */

/**
 * Removes every trailing `/`.
 *
 * @param value - URL or path
 * @returns `value` without trailing slashes
 */
export const stripTrailingSlashes = (value: string): string => {
  let end = value.length
  while (end > 0 && value[end - 1] === '/') end -= 1
  return value.slice(0, end)
}
