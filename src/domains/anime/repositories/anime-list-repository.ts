/**
 * Data access and filter builders for paginated anime list queries.
 *
 * @module domains/anime/repositories/anime-list-repository
 */
import { db } from '@db/client'
import { anime } from '@db/schemas/anime'
import { animeGenre } from '@db/schemas/anime-relations'
import { genre as genreTable } from '@db/schemas/anime-taxonomy'
import { dbError } from '@shared/errors/db-errors'
import type { AnimeDB, AnimeFilters } from '@domains/anime/types'
import {
  buildAnimeListFilters,
  type AnimeListFilterParams,
} from '@domains/anime/repositories/anime-list-filters'
import { and, countDistinct, eq } from 'drizzle-orm'

// Re-exported so consumers importing from `@domains/anime/repositories/anime-list-repository`
// keep access to the filter builder.
export * from '@domains/anime/repositories/anime-list-filters'

/**
 * Repository for querying filtered and paginated anime lists.
 *
 * @remarks
 * **Tables:** `anime` LEFT JOIN `anime_genre` LEFT JOIN `genre`
 *
 * **SQL:** `SELECT DISTINCT anime.*` with `LIMIT` / `OFFSET`; count uses
 * `countDistinct(anime.mal_id)`.
 *
 * **Empty vs null:** List methods return `[]` or `0`; never `null`/`undefined` totals.
 *
 * @see {@link animeListService}
 * @see {@link mapAnimeListToCards}
 */
export const animeListRepository = {
  /**
   * Loads a paginated anime list matching the provided filters.
   *
   * @param filters - {@link AnimeFilters} including `page`, `limit`, and facets
   * @returns Distinct {@link AnimeDB} rows for the current page
   *
   * @throws {InfraError} On database failure (`[GET_ANIME_LIST]`)
   *
   * @example
   * ```typescript
   * const rows = await animeListRepository.getAnimeList({
   *   page: 1, limit: 20, genre: ['Action'],
   * })
   * ```
   */
  async getAnimeList({
    page,
    limit,
    ...filterParams
  }: AnimeFilters): Promise<AnimeDB[]> {
    try {
      const whereConditions = buildAnimeListFilters(filterParams)

      const result = await db
        .selectDistinct({ anime })
        .from(anime)
        .leftJoin(animeGenre, eq(animeGenre.animeId, anime.malId))
        .leftJoin(genreTable, eq(genreTable.malId, animeGenre.genreId))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .limit(limit)
        .offset((page - 1) * limit)

      return result.map(({ anime: animeRow }) => animeRow)
    } catch (error) {
      throw dbError('[GET_ANIME_LIST]', {}, error)
    }
  },

  /**
   * Counts distinct anime rows matching the provided filters.
   *
   * @param filterParams - Filters without pagination
   * @returns Total matching anime count (`0` when none)
   *
   * @throws {InfraError} On database failure (`[GET_ANIME_LIST_COUNT]`)
   */
  async getAnimeListCount(
    filterParams: AnimeListFilterParams
  ): Promise<number> {
    try {
      const whereConditions = buildAnimeListFilters(filterParams)

      const result = await db
        .selectDistinct({ count: countDistinct(anime.malId) })
        .from(anime)
        .leftJoin(animeGenre, eq(animeGenre.animeId, anime.malId))
        .leftJoin(genreTable, eq(genreTable.malId, animeGenre.genreId))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

      return result[0]?.count ?? 0
    } catch (error) {
      throw dbError('[GET_ANIME_LIST_COUNT]', {}, error)
    }
  },
}
