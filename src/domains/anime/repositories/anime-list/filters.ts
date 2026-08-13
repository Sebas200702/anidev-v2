/**
 * SQL filter builders for paginated anime list queries.
 *
 * @module domains/anime/repositories/anime-list/filters
 * @remarks
 * Pure builder translating normalized {@link AnimeFilters} (minus pagination) into Drizzle `SQL`
 * fragments combined with `AND` by {@link animeListRepository}.
 */
import { anime } from '@db/schemas/anime'
import { genre as genreTable } from '@db/schemas/anime-taxonomy'
import {
  eq,
  gte,
  inArray,
  isNull,
  lte,
  notInArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'
import type { AnimeListFilterParams } from './filters.types'

export type { AnimeListFilterParams } from './filters.types'

/**
 * MAL age ratings excluded by the `safe` parental variant.
 *
 * @remarks
 * Confirm/extend against live `anime.rating` values (e.g. `R+ - Mild Nudity`)
 * before enabling an opt-in `full` variant. See the advanced-search change.
 */
export const ADULT_RATINGS = ['Rx - Hentai'] as const

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
  season,
  scoreMin,
  scoreMax,
  parentalVariant,
}: AnimeListFilterParams): SQL[] => {
  const filters: SQL[] = []

  // Parental floor: exclude adult ratings unless explicitly `full`. Fail-closed —
  // an unset variant is treated as `safe`. Unknown (null) ratings are kept.
  if (parentalVariant !== 'full') {
    const notAdult = or(
      isNull(anime.rating),
      notInArray(anime.rating, [...ADULT_RATINGS])
    )
    if (notAdult) {
      filters.push(notAdult)
    }
  }

  if (year) {
    filters.push(eq(anime.year, year))
  }

  if (season) {
    filters.push(eq(anime.season, season))
  }

  if (scoreMin !== undefined) {
    filters.push(gte(anime.score, scoreMin))
  }

  if (scoreMax !== undefined) {
    filters.push(lte(anime.score, scoreMax))
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
    // Index-backed substring match: the GIN pg_trgm indexes on these columns
    // accelerate `ILIKE '%q%'`, so this is not a sequential scan. Ranking by
    // similarity happens in the sort builder (relevance sort).
    const pattern = `%${query.trim()}%`

    filters.push(
      sql`(
        ${anime.title} ILIKE ${pattern}
        OR ${anime.titleEnglish} ILIKE ${pattern}
        OR ${anime.titleJapanese} ILIKE ${pattern}
      )`
    )
  }

  return filters
}
