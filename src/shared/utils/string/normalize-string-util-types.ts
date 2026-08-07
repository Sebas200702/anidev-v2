/**
 * Types for the string normalization utility.
 *
 * @module shared/utils/string/normalize-string-util-types
 * @remarks
 * Consumed by {@link module:shared/utils/string/normalize-string-util} to shape the
 * options that control punctuation stripping, space handling, and case folding.
 *
 * @see {@link normalizeString} for the normalization function
 */

/**
 * Options controlling how {@link normalizeString} transforms input.
 */
export interface NormalizeStringOptions {
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
