/**
 * Search domain constants.
 *
 * @module domains/search/constants
 * @remarks
 * Defined here (not inline in logic files) and imported where used.
 */

/** Max search-history rows retained per user; older rows are pruned on record. */
export const SEARCH_HISTORY_PER_USER_CAP = 50

/**
 * `Cache-Control` for search-history responses: personalized and never shared,
 * so caches (browser or intermediary) must not store them.
 */
export const SEARCH_HISTORY_CACHE_CONTROL = 'private, no-store'
