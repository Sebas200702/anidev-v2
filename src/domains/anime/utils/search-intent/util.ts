/**
 * Search-intent predicate for anime list requests.
 *
 * @module domains/anime/utils/search-intent/util
 * @remarks
 * Domain logic (knows the anime discovery filter fields) kept out of the route
 * container — the route only calls it to gate best-effort history recording.
 */
import { ANIME_SEARCH_INTENT_KEYS } from '@anime/constants'
import type { AnimeFiltersParams } from '@anime/types'

/**
 * Returns `true` when the request carries real search intent — a free-text term
 * or any discovery filter (see {@link ANIME_SEARCH_INTENT_KEYS}) — rather than
 * plain pagination/sort.
 *
 * @param query - Parsed anime list query params
 * @returns Whether the request should count as a search (e.g. for history)
 * @example
 * ```typescript
 * hasSearchIntent({ page: 1, limit: 10 }) // false
 * hasSearchIntent({ page: 1, limit: 10, query: 'bebop' }) // true
 * ```
 */
export const hasSearchIntent = (query: AnimeFiltersParams): boolean =>
  ANIME_SEARCH_INTENT_KEYS.some((key) => {
    const value = query[key]
    return typeof value === 'string' ? value.trim() !== '' : value !== undefined
  })
