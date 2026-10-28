/**
 * Domain constants for characters and people.
 *
 * @module domains/people/constants
 */

/** Normalized cast roles (the source mixes `MAIN` / `Main`, …). */
export const CAST_ROLES = ['main', 'supporting', 'background'] as const

/** Media of a staff credit or a character appearance. */
export const PEOPLE_MEDIA = ['anime', 'manga'] as const

/** Minimum search length, so `ILIKE '%q%'` stays selective. */
export const PEOPLE_SEARCH_MIN_LENGTH = 2

/** Anime listed per voiced character in `/api/people/:id/voices`. */
export const VOICE_ROLE_ANIME_LIMIT = 3
