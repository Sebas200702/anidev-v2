/**
 * Normalizes user-facing strings into URL- and slug-safe values by stripping punctuation and optionally folding case.
 *
 * @module shared/utils/string/normalize-string-util
 * @remarks
 * Intended for display titles, search keys, and slug segments — not for full Unicode normalization (NFC/NFD).
 *
 * @see {@link normalizeString}
 */

/**
 * Options controlling how {@link normalizeString} transforms input.
 */
export type NormalizeStringOptions = {
  /** Source string to normalize. Falsy values yield `''`. */
  string: string
  /**
   * When `true` (default), whitespace runs are replaced with `separator`.
   * When `false`, internal spaces are preserved after special-character removal.
   */
  removeSpaces?: boolean
  /** Replacement inserted between former space boundaries; defaults to `'-'`. */
  separator?: string
  /** When `true`, the final string is lowercased. */
  toLowerCase?: boolean
}

/**
 * Removes special characters and optionally replaces spaces in a string.
 *
 * @param options - Input string and normalization flags
 * @returns Normalized string, or `''` when `string` is empty, whitespace-only, or falsy
 *
 * @remarks
 * **Algorithm**
 * 1. Return `''` immediately if `string` is falsy (`''`, `null`-coerced empty).
 * 2. Remove characters matching a fixed punctuation/symbol class (slashes, brackets, quotes, etc.).
 * 3. If `removeSpaces` is true, replace every whitespace run with `separator` (default `'-'`).
 * 4. If `toLowerCase` is true, lowercase the result.
 *
 * **Edge cases**
 * - Empty input → `''` (no throw).
 * - Only removed characters → may yield `''` or only `separator` segments depending on spaces.
 * - Multiple consecutive spaces become multiple separators when `removeSpaces` is true (one per space match).
 * - Does not trim leading/trailing separators after space replacement.
 * - Non-Latin scripts are kept unless they match the removed character class.
 *
 * @example
 * ```typescript
 * normalizeString({ string: 'Hello, World!', toLowerCase: true })
 * // 'hello-world'
 *
 * normalizeString({ string: 'Foo Bar', removeSpaces: false })
 * // 'Foo Bar' (comma removed, spaces kept)
 * ```
 */
export const normalizeString = ({
  string,
  removeSpaces = true,
  separator = '-',
  toLowerCase = false,
}: NormalizeStringOptions): string => {
  if (!string) return ''

  const specialCharsPattern = /[/?¡.:,;¿!@#$%^&*()\-_=+[\]{}|\\'<>`~"]/g
  let result = string.replaceAll(specialCharsPattern, '')

  if (removeSpaces) {
    result = result.replaceAll(/\s/g, separator)
  }

  return toLowerCase ? result.toLowerCase() : result
}
