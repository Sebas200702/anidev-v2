/**
 * Maps an anime airing status to semantic color tokens and classes.
 *
 * @module shared/utils/get-status-color/util
 */

const STATUS_TOKENS: Record<string, string> = {
  'currently airing': 'success',
  'finished airing': 'editorial-accent',
  'not yet aired': 'warning',
}

const FALLBACK_TOKEN = 'on-surface-muted'

/**
 * Full utility classes per token.
 *
 * @remarks
 * Tailwind only emits classes it finds in the source text, so an interpolated
 * `bg-${token}` never reaches the stylesheet. Consumers pick a class from this
 * table instead of building one.
 */
const STATUS_DOT_CLASSES: Record<string, string> = {
  success: 'bg-success',
  'editorial-accent': 'bg-editorial-accent',
  warning: 'bg-warning',
  'on-surface-muted': 'bg-on-surface-muted',
}

/**
 * Resolves the token name that represents an airing status.
 *
 * @param status - Raw MAL airing status (case-insensitive)
 * @returns A semantic token name (`success`, `editorial-accent`, `warning`)
 *
 * @example
 * ```typescript
 * getStatusColor('Currently Airing') // 'success'
 * getStatusColor('Whatever') // 'on-surface-muted'
 * ```
 */
export const getStatusColor = (status: string): string =>
  STATUS_TOKENS[status.toLowerCase()] ?? FALLBACK_TOKEN

/**
 * Resolves the background class for a status dot.
 *
 * @param status - Raw MAL airing status (case-insensitive)
 * @returns A Tailwind class (e.g. `bg-success`)
 *
 * @example
 * ```astro
 * <span class:list={['size-1.5 rounded-full', getStatusDotClass(anime.status)]} />
 * ```
 */
export const getStatusDotClass = (status: string): string =>
  STATUS_DOT_CLASSES[getStatusColor(status)] ??
  STATUS_DOT_CLASSES[FALLBACK_TOKEN]
