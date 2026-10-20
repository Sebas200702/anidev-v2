/**
 * Application services for the printed-media (manga) domain.
 *
 * @module domains/manga/services
 */
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { mangaListCache } from '@manga/cache/manga-list/cache'
import { mapMangaCard, mapMangaDetails } from '@manga/mappers/manga-mapper'
import { mangaListRepository } from '@manga/repositories/manga-list'
import { mangaDetailsRepository } from '@manga/repositories/manga-details'
import { mangaNotFound } from '@manga/errors/manga-not-found-error'
import type {
  MangaCard,
  MangaDetails,
  MangaFilters,
  MangaFiltersParams,
} from '@manga/types'

/**
 * Normalizes the raw query parameters into repository filters.
 *
 * @param params - Raw query parameters (coerced by Zod at the route)
 * @returns Normalized {@link MangaFilters}
 */
export const mapMangaFilters = (
  params: MangaFiltersParams
): MangaFilters => {
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
   * @returns `{ value, isStale }` — `{ list, total }` plus a stale flag
   * @throws {InfraError} On repository or cache failures
   */
  async getMangaList(
    filtersParams: MangaFiltersParams
  ): Promise<StaleResult<{ list: MangaCard[]; total: number }>> {
    const filters: MangaFilters = mapMangaFilters(filtersParams)
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

/**
 * Coordinates repository access and mapping for the printed-media detail.
 */
export const mangaDetailsService = {
  /**
   * Loads a printed work with its taxonomy, cast, staff and links.
   *
   * @param mangaId - MyAnimeList id of the work
   * @returns `{ value, isStale }` — the detail DTO plus a stale flag
   * @throws {InfraError} On repository or cache failures
   */
  async getMangaDetails(mangaId: number): Promise<StaleResult<MangaDetails>> {
    const key = `manga:detail:${mangaId}`
    return withStaleCache({
      key,
      staleKey: `${key}:stale`,
      getCache: () =>
        cacheGet<MangaDetails>(key),
      getStaleCache: (staleKey) => cacheGet<MangaDetails>(staleKey),
      setCache: (_, value) =>
        cacheSet(key, value, { ttlSeconds: CacheTtl.Medium }),
      setStaleCache: (staleKey, value) =>
        cacheSet(staleKey, value, { ttlSeconds: CacheTtl.Stale }),
      compute: async () => {
        const work = await mangaDetailsRepository.getManga(mangaId)
        if (!work) throw mangaNotFound(mangaId)

        const [
          genreLinks,
          themeLinks,
          demographicLinks,
          characters,
          staff,
          publishers,
          related,
          externalLinks,
        ] = await Promise.all([
          mangaDetailsRepository.getGenres(mangaId),
          mangaDetailsRepository.getThemes(mangaId),
          mangaDetailsRepository.getDemographics(mangaId),
          mangaDetailsRepository.getCharacters(mangaId),
          mangaDetailsRepository.getStaff(mangaId),
          mangaDetailsRepository.getPublishers(mangaId),
          mangaDetailsRepository.getRelated(mangaId),
          mangaDetailsRepository.getExternalLinks(mangaId),
        ])

        return mapMangaDetails({
          work,
          genres: genreLinks,
          themes: themeLinks,
          demographics: demographicLinks,
          characters,
          staff,
          publishers,
          related,
          externalLinks,
        })
      },
    })
  },
}
