/**
 * Application services for the printed-media (manga) domain.
 *
 * @module domains/manga/services
 */
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { mangaListCache } from '@manga/cache/manga-list/cache'
import { mapMangaCard } from '@manga/mappers/manga-mapper'
import { mangaListRepository } from '@manga/repositories/manga-list'
import type { MangaCard, MangaFilters, MangaFiltersParams } from '@manga/types'

/**
 * Normalizes the raw query parameters into repository filters.
 *
 * @param params - Raw query parameters (coerced by Zod at the route)
 * @returns Normalized {@link MangaFilters}
 */
export const mapMangaFilters = (params: MangaFiltersParams): MangaFilters => {
  const split = (value?: string): string[] | undefined =>
    value
      ?.split(',')
      .map((v) => v.trim())
      .filter(Boolean)

  return {
    page: params.page,
    limit: params.limit,
    type: split(params.type),
    genre: split(params.genre),
    theme: split(params.theme),
    demographic: split(params.demographic),
    status: split(params.status),
    year: params.year,
    query: params.query,
    scoreMin: params.scoreMin,
    scoreMax: params.scoreMax,
    sort: params.sort,
    order: params.order,
    // El control parental es fail-closed a `safe` (igual que en anime): la
    // variante se pliega en la clave de caché para que nunca se mezclen.
    parentalVariant: 'safe',
  }
}

/**
 * Coordinates repository access, mapping and caching for the printed-media
 * list.
 */
export const mangaListService = {
  /**
   * Loads a filtered, paginated printed-media list with the total count.
   *
   * @param filtersParams - Raw query parameters
   * @param scope - Server-side scope (e.g. `producerId`), folded into the cache key
   * @returns `{ value, isStale }` — `{ list, total }` plus a stale flag
   * @throws {InfraError} On repository or cache failures
   */
  async getMangaList(
    filtersParams: MangaFiltersParams,
    scope: Pick<MangaFilters, 'producerId'> = {}
  ): Promise<StaleResult<{ list: MangaCard[]; total: number }>> {
    const filters: MangaFilters = {
      ...mapMangaFilters(filtersParams),
      ...scope,
    }
    return withStaleCache({
      key: mangaListCache.key(filters),
      staleKey: `${mangaListCache.key(filters)}:stale`,
      getCache: () => mangaListCache.get(filters),
      getStaleCache: (key) =>
        cacheGet<{ list: MangaCard[]; total: number }>(key),
      setCache: (_, value) => mangaListCache.set(filters, value),
      setStaleCache: (key, value) =>
        cacheSet(key, value, { ttlSeconds: CacheTtl.Stale }),
      compute: async () => {
        const [rows, total] = await Promise.all([
          mangaListRepository.getMangaList(filters),
          mangaListRepository.countMangaList(filters),
        ])
        return { list: rows.map(mapMangaCard), total }
      },
    })
  },
}
