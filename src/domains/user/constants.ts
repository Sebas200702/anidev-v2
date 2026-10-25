/**
 * Domain constants for users and profiles.
 *
 * @module domains/user/constants
 */

/** Self-declared engagement level (onboarding step 3). */
export const FANATIC_LEVELS = ['low', 'medium', 'high'] as const

/** How often the user watches anime. */
export const WATCH_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const

/** Preferred anime format. */
export const PREFERRED_FORMATS = [
  'tv',
  'movie',
  'ova',
  'ona',
  'special',
  'music',
] as const

/** Maximum ids per favorite list (genres, studios, anime). */
export const MAX_FAVORITES_PER_LIST = 50
