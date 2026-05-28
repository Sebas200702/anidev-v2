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
import { normalizeString } from '@utils/string/normalize-string-util'
import type { AnimeDB, AnimeFilters } from '@domains/anime/types'
import { and, countDistinct, eq, inArray, sql, type SQL } from 'drizzle-orm'

/**
 * Filter fields used to build SQL `WHERE` clauses (excludes pagination).
 */
type AnimeListFilterParams = Omit<AnimeFilters, 'page' | 'limit'>

/**
 * Builds SQL filter clauses for anime list queries.
 *
 * @param filterParams - Normalized filter values excluding `page` / `limit`
 * @returns Array of Drizzle `SQL` fragments combined with `AND`
 *
 * @remarks
 * | Filter | Column(s) | Behavior |
 * |--------|-----------|----------|
 * | `year` | `anime.year` | equality |
 * | `status` | `anime.status` | `IN` |
 * | `rating` | `anime.rating` | `IN` |
 * | `type` | `anime.type` | `IN` |
 * | `genre` | `genre.name` via joins | `IN` on genre names |
 * | `query` | `title`, `title_english`, `title_japanese` | normalized `LIKE` (spaces stripped, lowercased) |
 *
 * @see {@link mapAnimeFilters}
 * @see {@link animeListRepository.getAnimeList}
 */
export const buildAnimeListFilters = ({
  genre,
  status,
  rating,
  type,
  year,
  query,
}: AnimeListFilterParams): SQL[] => {
  const filters: SQL[] = []

  if (year) {
    filters.push(eq(anime.year, year))
  }

  if (status?.length) {
    filters.push(inArray(anime.status, status))
  }

  if (rating?.length) {
    filters.push(inArray(anime.rating, rating))
  }

  if (type?.length) {
    filters.push(inArray(anime.type, type))
  }

  if (genre?.length) {
    filters.push(inArray(genreTable.name, genre))
  }

  if (query?.trim()) {
    const normalizedQuery = normalizeString({
      string: query,
      removeSpaces: true,
      separator: '',
      toLowerCase: true,
    })

    const queryPattern = `%${normalizedQuery}%`

    const normalizedTitle = sql`REPLACE(LOWER(${anime.title}), ' ', '')`
    const normalizedTitleEng = sql`REPLACE(LOWER(COALESCE(${anime.titleEnglish}, '')), ' ', '')`
    const normalizedTitleJpn = sql`REPLACE(LOWER(COALESCE(${anime.titleJapanese}, '')), ' ', '')`

    filters.push(
      sql`(
        ${normalizedTitle} LIKE ${queryPattern}
        OR ${normalizedTitleEng} LIKE ${queryPattern}
        OR ${normalizedTitleJpn} LIKE ${queryPattern}
      )`
    )
  }

  return filters
}

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
