/**
 * ORDER BY builder for paginated anime list queries.
 *
 * @module domains/anime/repositories/anime-list/sort
 * @remarks
 * Maps the whitelisted `sort`/`order` filters to Drizzle order fragments and
 * always appends `anime.malId` as a unique secondary key so `LIMIT`/`OFFSET`
 * pages are deterministic. Never interpolates raw input into SQL.
 */
import { anime } from '@db/schemas/anime'
import { RELEVANCE_RANK_ALIAS } from '@anime/constants'
import type { AnimeSortField } from '@anime/schemas/anime-list-schema'
import { asc, desc, sql, type SQL } from 'drizzle-orm'

/**
 * Trigram similarity ranking expression for the relevance sort, aliased so it is
 * emitted as `... as "sim_rank"` and can be referenced by ORDER BY under
 * `SELECT DISTINCT`.
 */
export const relevanceRankExpr = (query: string) =>
  sql`similarity(${anime.title}, ${query})`.as(RELEVANCE_RANK_ALIAS)

/** Primary-sort column per non-relevance whitelisted field. */
const sortColumn = {
  score: anime.score,
  year: anime.year,
  title: anime.title,
} satisfies Record<Exclude<AnimeSortField, 'relevance'>, unknown>

/**
 * Builds the ORDER BY fragments (primary field + `malId` tiebreaker).
 *
 * @param filters - `sort` (default `score`), `order` (default `desc`), and
 *   `query` (required by `relevance`, which is validated at the request edge)
 * @returns Ordered Drizzle `SQL` fragments for `.orderBy(...)`
 *
 * @remarks
 * `relevance` ranks by `pg_trgm` `similarity(title, query)` (always
 * most-similar-first, ignoring `order`) and relies on the GIN trigram index.
 */
export const buildAnimeListSort = ({
  sort = 'score',
  order = 'desc',
  query,
}: {
  sort?: AnimeSortField
  order?: 'asc' | 'desc'
  query?: string
}): SQL[] => {
  if (sort === 'relevance' && query?.trim()) {
    // Order by the select-list alias (required by SELECT DISTINCT), not the raw
    // expression. The repository selects `relevanceRankExpr` as this alias.
    return [desc(sql.identifier(RELEVANCE_RANK_ALIAS)), asc(anime.malId)]
  }

  const field = sort === 'relevance' ? 'score' : sort
  const column = sortColumn[field]
  const primary = order === 'asc' ? asc(column) : desc(column)

  return [primary, asc(anime.malId)]
}
