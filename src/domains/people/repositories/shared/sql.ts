/**
 * SQL fragments shared by the people repositories.
 *
 * @module domains/people/repositories/shared/sql
 * @remarks Every value is a bound parameter; nothing is interpolated.
 */
import {
  ADULT_RATINGS,
  PROVISIONAL_CHARACTER_NAME_PREFIX,
} from '@anime/constants'
import { ADULT_MANGA_GENRES } from '@manga/constants'
import { sql, type SQL } from 'drizzle-orm'

/** `LIKE` pattern of provisional character names (`Personaje <id>`). */
export const PROVISIONAL_NAME_PATTERN = `${PROVISIONAL_CHARACTER_NAME_PREFIX}%`

/** `ILIKE` substring pattern of a search term. */
export const containsPattern = (query: string) => `%${query}%`

/** Bound list of a constant array (`$1, $2, …`) for `IN (…)`. */
const boundList = (values: readonly string[]): SQL =>
  sql.join(
    values.map((value) => sql.param(value)),
    sql.raw(', ')
  )

const adultRatings = boundList(ADULT_RATINGS)
const adultGenres = boundList(ADULT_MANGA_GENRES)

/** Table alias for raw SQL (`a`, `m`, …); a fixed identifier, never input. */
export const alias = (name: string): SQL => sql.raw(name)

/** `safe` floor for an anime alias: unknown or non-adult rating. */
export const safeAnimeSql = (table: SQL): SQL =>
  sql`(${table}.rating IS NULL OR ${table}.rating NOT IN (${adultRatings}))`

/** `safe` floor for a manga alias: no adult genre. */
export const safeMangaSql = (table: SQL): SQL =>
  sql`NOT EXISTS (SELECT 1 FROM manga_genre mg
    JOIN genre g ON g.mal_id = mg.genre_id
    WHERE mg.manga_id = ${table}.mal_id AND g.name IN (${adultGenres}))`

/** Sort rank of a raw cast role: main, supporting, then everything else. */
export const castRoleRankSql = (role: SQL): SQL =>
  sql`CASE lower(${role}) WHEN 'main' THEN 0 WHEN 'supporting' THEN 1 ELSE 2 END`

/** `LIMIT … OFFSET …` of a 1-based page. */
export const pageSql = ({ page, limit }: { page: number; limit: number }) =>
  sql`LIMIT ${limit} OFFSET ${(page - 1) * limit}`
