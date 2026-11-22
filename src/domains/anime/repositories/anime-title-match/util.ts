/**
 * SQL conditions that match an anime by any of its titles.
 *
 * @module domains/anime/repositories/anime-title-match/util
 */
import { anime, animeTitleSynonym } from '@db/schemas/anime'
import { ADULT_RATINGS } from '@anime/constants'
import { inArray, sql, type SQL } from 'drizzle-orm'

/**
 * Substring match of `query` against the canonical, English and Japanese
 * titles of `anime`, plus its synonyms.
 *
 * @remarks
 * The GIN `pg_trgm` indexes on these columns (and on
 * `anime_title_synonym.title`) back `ILIKE '%q%'`, so it is not a sequential
 * scan. The condition references the `anime` table: use it where that table
 * is in scope.
 *
 * @param query - Search term (trimmed here)
 */
export const animeTitleMatch = (query: string): SQL => {
  const pattern = `%${query.trim()}%`

  return sql`(
    ${anime.title} ILIKE ${pattern}
    OR ${anime.titleEnglish} ILIKE ${pattern}
    OR ${anime.titleJapanese} ILIKE ${pattern}
    OR EXISTS (
      SELECT 1 FROM ${animeTitleSynonym}
      WHERE ${animeTitleSynonym.animeId} = ${anime.malId}
      AND ${animeTitleSynonym.title} ILIKE ${pattern}
    )
  )`
}

/** Fail-closed parental floor: unknown (null) or non-adult rating. */
const safeRating = (): SQL =>
  sql`(${anime.rating} IS NULL OR NOT ${inArray(anime.rating, [...ADULT_RATINGS])})`

/**
 * Subquery of the ids of non-adult anime whose title, English or Japanese
 * title, or any synonym contains `query`.
 *
 * @remarks
 * Used when another catalog (music, characters) is searched through the title
 * of its anime, so an adult anime never surfaces its related rows. Built as a
 * `UNION` of two branches so each one can use its own GIN `pg_trgm` index; a
 * single `OR EXISTS` condition (as in {@link animeTitleMatch}) forces the
 * planner to walk every relation row instead.
 *
 * @param query - Search term (trimmed here)
 * @returns `(SELECT mal_id …) UNION (SELECT anime_id …)`, for `IN (…)`
 */
export const safeAnimeIdsByTitle = (query: string): SQL => {
  const pattern = `%${query.trim()}%`

  return sql`(
    SELECT ${anime.malId} FROM ${anime}
    WHERE (
      ${anime.title} ILIKE ${pattern}
      OR ${anime.titleEnglish} ILIKE ${pattern}
      OR ${anime.titleJapanese} ILIKE ${pattern}
    ) AND ${safeRating()}
    UNION
    SELECT ${animeTitleSynonym.animeId} FROM ${animeTitleSynonym}
    INNER JOIN ${anime} ON ${anime.malId} = ${animeTitleSynonym.animeId}
    WHERE ${animeTitleSynonym.title} ILIKE ${pattern} AND ${safeRating()}
  )`
}
