/**
 * Catalog search across anime, printed media, music and characters.
 *
 * @module domains/search/services/catalog-search/service
 */
import { animeListService } from '@anime/services/anime-list'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { mangaListService } from '@manga/services/manga-service'
import { musicListService } from '@music/services/music-list'
import { characterService } from '@people/services/character'
import type { CatalogSearchQuery, CatalogSearchResult } from './types'

/**
 * Delegates a free-text search to the list service of the requested catalog.
 *
 * @remarks
 * Both lists match the query against titles **and** synonyms through their
 * `pg_trgm` indexes, keep the fail-closed parental floor and their own cache.
 * Anime results rank by trigram relevance; manga by score. Music matches the
 * theme title and characters their name (most favorited first); both also
 * match the title of their (non-adult) anime, so searching an anime title
 * lists its themes or its cast. Each goes through its own service and cache.
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
    if (type === 'music') {
      const { value, isStale } = await musicListService.getMusicList({
        query: q,
        page,
        limit,
      })
      return { value: { type, ...value }, isStale }
    }

    if (type === 'characters') {
      const { value, isStale } = await characterService.search({
        query: q,
        page,
        limit,
      })
      return { value: { type, ...value }, isStale }
    }

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
