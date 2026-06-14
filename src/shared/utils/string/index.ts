/**
 * String normalization helpers for slugs, search keys, and display-safe values.
 *
 * @module shared/utils/string
 * @remarks
 * Currently exposes {@link normalizeString} for stripping punctuation and optional slugification.
 *
 * @see {@link module:shared/utils/string/normalize-string-util}
 */

export { type NormalizeStringOptions, normalizeString } from './normalize-string-util'
