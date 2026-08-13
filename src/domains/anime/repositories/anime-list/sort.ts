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
import type { AnimeSortField } from '@anime/schemas/anime-list-schema'
import { asc, desc, type SQL } from 'drizzle-orm'

/** Primary-sort column per whitelisted field. */
const sortColumn = {
  score: anime.score,
  year: anime.year,
  title: anime.title,
  // Stage 1a: relevance ranking (pg_trgm similarity) lands with the text-index
  // migration; until then it falls back to score ordering.
  relevance: anime.score,
} satisfies Record<AnimeSortField, unknown>

/**
 * Builds the ORDER BY fragments (primary field + `malId` tiebreaker).
 *
 * @param filters - `sort` (default `score`) and `order` (default `desc`)
 * @returns Ordered Drizzle `SQL` fragments for `.orderBy(...)`
 */
export const buildAnimeListSort = ({
  sort = 'score',
  order = 'desc',
}: {
  sort?: AnimeSortField
  order?: 'asc' | 'desc'
}): SQL[] => {
  const column = sortColumn[sort]
  const primary = order === 'asc' ? asc(column) : desc(column)

  return [primary, asc(anime.malId)]
}
