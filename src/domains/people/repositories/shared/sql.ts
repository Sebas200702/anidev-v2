/**
 * SQL fragments shared by the people repositories.
 *
 * @module domains/people/repositories/shared/sql
 * @remarks Every value is a bound parameter; nothing is interpolated.
 */
import { ADULT_RATINGS } from '@anime/constants'
import { PROVISIONAL_CHARACTER_NAME_PREFIX } from '@anime/constants'
import { ADULT_MANGA_GENRES } from '@manga/constants'
import { sql, type SQL } from 'drizzle-orm'

/** `LIKE` pattern of provisional character names (`Personaje <id>`). */
export const PROVISIONAL_NAME_PATTERN = `${PROVISIONAL_CHARACTER_NAME_PREFIX}%`

/** `ILIKE` substring pattern of a search term. */
export const containsPattern = (query: string) => `%${query}%`

/** `safe` floor for an anime alias: unknown or non-adult rating. */
export const safeAnimeSql = (alias: SQL): SQL =>
  sql`(${alias}.rating IS NULL OR ${alias}.rating NOT IN (${sql.join(
    ADULT_RATINGS.map((rating) => sql`${rating}`),
    sql`, `
  )}))`

/** `safe` floor for a manga alias: no adult genre. */
export const safeMangaSql = (alias: SQL): SQL =>
  sql`NOT EXISTS (SELECT 1 FROM manga_genre mg
    JOIN genre g ON g.mal_id = mg.genre_id
    WHERE mg.manga_id = ${alias}.mal_id AND g.name IN (${sql.join(
      ADULT_MANGA_GENRES.map((name) => sql`${name}`),
      sql`, `
    )}))`

/** Sort rank of a raw cast role: main, supporting, then everything else. */
export const castRoleRankSql = (role: SQL): SQL =>
  sql`CASE lower(${role}) WHEN 'main' THEN 0 WHEN 'supporting' THEN 1 ELSE 2 END`

/** `LIMIT … OFFSET …` of a 1-based page. */
export const pageSql = ({ page, limit }: { page: number; limit: number }) =>
  sql`LIMIT ${limit} OFFSET ${(page - 1) * limit}`
