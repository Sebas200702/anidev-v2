/**
 * Application service for paginated anime list data.
 *
 * @module domains/anime/services/anime-list-service
 */
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { animeListCache } from '@anime/cache/anime-list-cache'
import { mapAnimeListToCards } from '@anime/mappers/anime-card-mapper'
import { mapAnimeFilters } from '@anime/mappers/anime-filters-mapper'
import { animeListRepository } from '@anime/repositories/anime-list-repository'
import type { AnimeFilters, AnimeFiltersParams, AnimeCard } from '@anime/types'

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
   * @returns `{ value, isStale }` — `{ list: AnimeCard[], total: number }`
   * payload plus a stale flag
   *
   * @throws {InfraError} On repository or cache failures
   *
   * @example
   * ```typescript
   * const { value, isStale } = await animeListService.getAnimeList({
   *   page: '1', limit: '20', genre: 'Action',
   * })
   * ```
   */
  async getAnimeList(
    filtersParams: AnimeFiltersParams
  ): Promise<StaleResult<{ list: AnimeCard[]; total: number }>> {
    const filters: AnimeFilters = mapAnimeFilters(filtersParams)
    return withStaleCache({
      key: animeListCache.key(filters),
      staleKey: `${animeListCache.key(filters)}:stale`,
      getCache: () => animeListCache.get(filters),
      getStaleCache: (key) =>
        cacheGet<{ list: AnimeCard[]; total: number }>(key),
      setCache: (_, value) => animeListCache.set(filters, value),
      setStaleCache: (key, value) =>
        cacheSet(key, value, { ttlSeconds: CacheTtl.Stale }),
      compute: async () => {
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
