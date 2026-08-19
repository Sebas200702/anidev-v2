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

/**
 * Media assets a home-carousel slide cannot render without.
 *
 * @remarks
 * The slide is built from a banner plus the title's clear logo, so an anime
 * missing either one is not eligible.
 *
 * @see {@link animeCarouselRepository.getTopPopularWithMedia}
 */
export const CAROUSEL_REQUIRED_MEDIA_TYPES = ['banner', 'clearlogo'] as const

/** How many slides the home carousel shows. */
export const CAROUSEL_SLIDE_LIMIT = 6

/**
 * Media source preference when an anime has the same asset from several
 * providers (first match wins).
 */
export const CAROUSEL_SOURCE_PRIORITY = ['anilist', 'kitsu', 'thetvdb'] as const

/**
 * MAL airing statuses, in lifecycle order.
 *
 * @remarks
 * Used by the showcase to offer every status a card can render, including the
 * ones no seeded row happens to have.
 *
 * @see {@link getStatusColor}
 */
export const ANIME_STATUSES = [
  'Currently Airing',
  'Finished Airing',
  'Not yet aired',
] as const

/** How many cards the showcase scans when resolving `?id=` for a card demo. */
export const SHOWCASE_CARD_SEARCH_LIMIT = 24
