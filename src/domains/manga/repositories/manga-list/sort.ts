/**
 * ORDER BY builder for paginated printed-media (manga) list queries.
 *
 * @module domains/manga/repositories/manga-list/sort
 * @remarks
 * Maps the whitelisted `sort`/`order` filters to Drizzle order fragments and
 * always appends `manga.malId` as a unique secondary key so `LIMIT`/`OFFSET`
 * pages are deterministic. Never interpolates raw input into SQL.
 */
import { manga } from '@db/schemas/manga'
import type { mangaSortFields } from '@manga/schemas'
import { asc, desc, type SQL } from 'drizzle-orm'

type MangaSortField = (typeof mangaSortFields)[number]

/** Primary-sort column per whitelisted field. */
const sortColumn = {
  score: manga.score,
  year: manga.year,
  title: manga.title,
} satisfies Record<MangaSortField, unknown>

/**
 * Builds the ORDER BY fragments (primary field + `malId` tiebreaker).
 *
 * @param filters - `sort` (default `score`) and `order` (default `desc`)
 * @returns Ordered Drizzle `SQL` fragments for `.orderBy(...)`
 *
 * @example
 * ```ts
 * db.select().from(manga).orderBy(...buildMangaListSort({ sort: 'year' }))
 * ```
 */
export const buildMangaListSort = ({
  sort = 'score',
  order = 'desc',
}: {
  sort?: MangaSortField
  order?: 'asc' | 'desc'
}): SQL[] => {
  const column = sortColumn[sort]
  const primary = order === 'asc' ? asc(column) : desc(column)

  return [primary, asc(manga.malId)]
}
