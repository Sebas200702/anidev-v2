/**
 * Maps raw list query parameters into normalized filter objects.
 *
 * @module domains/anime/mappers/anime-filters-mapper
 */
import type { AnimeFilters, AnimeFiltersParams } from '@domains/anime/types'

/**
 * Coerces a scalar or array query value into an array for SQL `IN` filters.
 *
 * @internal
 */
const toArray = <T>(value: T | T[] | undefined): T[] | undefined => {
  if (!value) {
    return undefined
  }
  return Array.isArray(value) ? value : [value]
}

/**
 * Normalizes request query parameters into repository-ready filters.
 *
 * @param params - Raw query from {@link animeFiltersParamsSchema} (strings / scalars)
 * @returns {@link AnimeFilters} with facet fields as arrays when provided
 *
 * @remarks
 * Used by {@link animeListService} for both repository queries and
 * {@link animeListCache.key} (must stay stable for cache hits).
 *
 * @example
 * ```typescript
 * mapAnimeFilters({ page: 1, limit: 10, genre: 'Action' })
 * // { page: 1, limit: 10, genre: ['Action'], ... }
 * ```
 *
 * @see {@link buildAnimeListFilters}
 */
export const mapAnimeFilters = (params: AnimeFiltersParams): AnimeFilters => {
  return {
    genre: toArray(params.genre),
    status: toArray(params.status),
    rating: toArray(params.rating),
    type: toArray(params.type),
    year: params.year,
    query: params.query,
    page: params.page,
    limit: params.limit,
  }
}
