/**
 * Catalog search across anime and printed media.
 *
 * @module domains/search/services/catalog-search/service
 */
import { animeListService } from '@anime/services/anime-list'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { mangaListService } from '@manga/services/manga-service'
import type { CatalogSearchQuery, CatalogSearchResult } from './types'

/**
 * Delegates a free-text search to the list service of the requested catalog.
 *
 * @remarks
 * Both lists match the query against titles **and** synonyms through their
 * `pg_trgm` indexes, keep the fail-closed parental floor and their own cache.
 * Anime results rank by trigram relevance; manga by score.
 */
export const catalogSearchService = {
  /**
   * Searches one catalog.
   *
   * @param query - Validated `{ q, type, page, limit }`
   * @returns `{ value, isStale }` — the tagged page of cards and the total
   * @throws {InfraError} On repository or cache failures
   */
  async search({
    q,
    type,
    page,
    limit,
  }: CatalogSearchQuery): Promise<StaleResult<CatalogSearchResult>> {
    if (type === 'manga') {
      const { value, isStale } = await mangaListService.getMangaList({
        query: q,
        page,
        limit,
      })
      return { value: { type, ...value }, isStale }
    }

    const { value, isStale } = await animeListService.getAnimeList({
      query: q,
      sort: 'relevance',
      page,
      limit,
    })
    return { value: { type, ...value }, isStale }
  },
}
