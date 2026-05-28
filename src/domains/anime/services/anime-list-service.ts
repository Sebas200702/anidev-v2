/**
 * Application service for paginated anime list data.
 *
 * @module domains/anime/services/anime-list-service
 */
import { withCache } from '@lib/cache'
import { animeListCache } from '@domains/anime/cache/anime-list-cache'
import { mapAnimeListToCards } from '@domains/anime/mappers/anime-card-mapper'
import { mapAnimeFilters } from '@domains/anime/mappers/anime-filters-mapper'
import { animeListRepository } from '@domains/anime/repositories/anime-list-repository'
import type {
  AnimeFilters,
  AnimeFiltersParams,
} from '@domains/anime/types'

/**
 * Coordinates repository access, mapping, and caching for anime list pages.
 *
 * @remarks
 * **Pipeline:** `mapAnimeFilters(params)` → `anime:list:{JSON}` → list + count
 * repos → `mapAnimeListToCards` → `{ list, total }`
 *
 * **Cache TTL:** {@link CacheTtl.Medium} (3600 s)
 *
 * @see {@link animeListCache}
 */
export const animeListService = {
  /**
   * Loads a filtered, paginated anime list with total count.
   *
   * @param filtersParams - Raw query parameters (coerced by Zod at the route)
   * @returns `{ list: AnimeCard[], total: number }` for the current filter page
   *
   * @throws {InfraError} On repository or cache failures
   *
   * @example
   * ```typescript
   * const { list, total } = await animeListService.getAnimeList({
   *   page: '1', limit: '20', genre: 'Action',
   * })
   * ```
   */
  async getAnimeList(filtersParams: AnimeFiltersParams) {
    return withCache({
      key: animeListCache.key(mapAnimeFilters(filtersParams)),
      getCache: () => animeListCache.get(mapAnimeFilters(filtersParams)),
      setCache: (_, value) =>
        animeListCache.set(mapAnimeFilters(filtersParams), value),
      compute: async () => {
        const filters: AnimeFilters = mapAnimeFilters(filtersParams)
        const animeList = await animeListRepository.getAnimeList(filters)
        const total = await animeListRepository.getAnimeListCount(filters)

        return {
          list: mapAnimeListToCards({
            animeList,
          }),
          total,
        }
      },
    })
  },
}
