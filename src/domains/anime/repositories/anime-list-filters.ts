/**
 * SQL filter builders for paginated anime list queries.
 *
 * @module domains/anime/repositories/anime-list-filters
 * @remarks
 * Pure builder translating normalized {@link AnimeFilters} (minus pagination) into Drizzle `SQL`
 * fragments combined with `AND` by {@link animeListRepository}.
 */
import { anime } from '@db/schemas/anime'
import { genre as genreTable } from '@db/schemas/anime-taxonomy'
import { normalizeString } from '@utils/string/normalize-string-util'
import type { AnimeFilters } from '@domains/anime/types'
import { eq, inArray, sql, type SQL } from 'drizzle-orm'

/**
 * Filter fields used to build SQL `WHERE` clauses (excludes pagination).
 */
export type AnimeListFilterParams = Omit<AnimeFilters, 'page' | 'limit'>

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
