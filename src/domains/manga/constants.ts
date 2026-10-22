/**
 * Domain constants for the printed-media (manga) domain.
 *
 * @module domains/manga/constants
 */

/**
 * Genre names considered adult content for parental-control purposes.
 *
 * @remarks
 * Mirrors {@link module:domains/anime/constants.ADULT_RATINGS} for the anime
 * domain, but manga has no `rating` column, so the floor is expressed as a
 * genre exclusion. Fail-closed: an unset parental variant is treated as `safe`.
 */
export const ADULT_MANGA_GENRES = ['Hentai', 'Erotica'] as const
