/**
 * Anime domain constants.
 *
 * @module domains/anime/constants
 * @remarks
 * Shared constant values for anime catalog search. Defined here (not inline in
 * logic files) and imported where used.
 */

/**
 * MAL age ratings excluded by the `safe` parental variant.
 *
 * @remarks
 * Confirm/extend against live `anime.rating` values (e.g. `R+ - Mild Nudity`)
 * before enabling an opt-in `full` variant.
 */
export const ADULT_RATINGS = ['Rx - Hentai'] as const

/**
 * Select-list alias for the relevance ranking column. `SELECT DISTINCT` requires
 * ORDER BY expressions to be in the select list, so the repository selects the
 * similarity as this alias and the sort orders by it.
 */
export const RELEVANCE_RANK_ALIAS = 'sim_rank'

/** Whitelisted sort fields for the anime list/search query. */
export const animeSortFields = ['score', 'year', 'title', 'relevance'] as const

/**
 * Query fields that mark a request as a real *search* (vs. plain pagination).
 *
 * @remarks
 * Used to decide whether `GET /api/anime` records a best-effort search-history
 * entry for the authenticated user. `page`/`limit`/`sort`/`order` alone are
 * browsing, not a search, so they are excluded.
 */
export const ANIME_SEARCH_INTENT_KEYS = [
  'query',
  'genre',
  'status',
  'rating',
  'year',
  'type',
  'season',
  'scoreMin',
  'scoreMax',
] as const
