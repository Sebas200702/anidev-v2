/**
 * Data access and filter builders for paginated music list queries.
 *
 * @module domains/music/repositories/music-list-repository
 */
import { db } from '@db/client'
import { music } from '@db/schemas/music'
import { dbError } from '@shared/errors/db-errors'
import { normalizeString } from '@utils/string/normalize-string-util'
import type { MusicDB, MusicListFilters } from '@domains/music/types'
import { and, count, eq, sql, type SQL } from 'drizzle-orm'

/**
 * Filter fields used to build SQL `WHERE` clauses (excludes pagination).
 */
type MusicListFilterParams = Omit<MusicListFilters, 'page' | 'limit'>

/**
 * Builds SQL filter clauses for music list queries.
 *
 * @param filterParams - Normalized filter values excluding `page` / `limit`
 * @returns Array of Drizzle `SQL` fragments combined with `AND`
 *
 * @remarks
 * | Filter | Column | Behavior |
 * |--------|--------|----------|
 * | `type` | `music.type` | equality (`OP`, `ED`, `UNK`) |
 * | `query` | `music.title` | normalized `LIKE` (spaces stripped, lowercased) |
 *
 * @see {@link mapMusicListFilters}
 * @see {@link musicListRepository.getMusicList}
 */
export const buildMusicListFilters = ({
  type,
  query,
}: MusicListFilterParams): SQL[] => {
  const filters: SQL[] = []

  if (type) {
    filters.push(eq(music.type, type))
  }

  if (query?.trim()) {
    const normalizedQuery = normalizeString({
      string: query,
      removeSpaces: true,
      separator: '',
      toLowerCase: true,
    })

    const queryPattern = `%${normalizedQuery}%`
    const normalizedTitle = sql`REPLACE(LOWER(COALESCE(${music.title}, '')), ' ', '')`

    filters.push(sql`${normalizedTitle} LIKE ${queryPattern}`)
  }

  return filters
}

/**
 * Repository for querying filtered and paginated music lists.
 *
 * @remarks
 * **Table:** `music`
 *
 * **SQL:** `SELECT *` with `LIMIT` / `OFFSET`; count uses `count()`.
 *
 * @see {@link musicListService}
 * @see {@link mapMusicListToCards}
 */
export const musicListRepository = {
  /**
   * Loads a paginated music list matching the provided filters.
   *
   * @param filters - {@link MusicListFilters} including `page`, `limit`, and facets
   * @returns {@link MusicDB} rows for the current page
   *
   * @throws {DbError} On database failure
   *
   * @example
   * ```typescript
   * const rows = await musicListRepository.getMusicList({
   *   page: 1, limit: 20, type: 'OP',
   * })
   * ```
   */
  async getMusicList({
    page,
    limit,
    ...filterParams
  }: MusicListFilters): Promise<MusicDB[]> {
    try {
      const whereConditions = buildMusicListFilters(filterParams)

      return await db
        .select()
        .from(music)
        .where(
          whereConditions.length > 0 ? and(...whereConditions) : undefined
        )
        .limit(limit)
        .offset((page - 1) * limit)
    } catch (error) {
      throw dbError('getMusicList', { page, limit, ...filterParams }, error)
    }
  },

  /**
   * Counts music rows matching the provided filters.
   *
   * @param filterParams - Filters without pagination
   * @returns Total matching count (`0` when none)
   *
   * @throws {DbError} On database failure
   */
  async getMusicListCount(
    filterParams: MusicListFilterParams
  ): Promise<number> {
    try {
      const whereConditions = buildMusicListFilters(filterParams)

      const [result] = await db
        .select({ count: count() })
        .from(music)
        .where(
          whereConditions.length > 0 ? and(...whereConditions) : undefined
        )

      return result?.count ?? 0
    } catch (error) {
      throw dbError('getMusicListCount', filterParams, error)
    }
  },
}
