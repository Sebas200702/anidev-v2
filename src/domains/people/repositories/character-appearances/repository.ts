/**
 * Data access for the works where a character appears.
 *
 * @module domains/people/repositories/character-appearances/repository
 */
import { db } from '@db/client'
import { dbError } from '@shared/errors/db-errors'
import {
  castRoleRankSql,
  pageSql,
  safeAnimeSql,
  safeMangaSql,
} from '@people/repositories/shared/sql'
import type { AppearanceRow, PeoplePage } from '@people/types'
import { sql } from 'drizzle-orm'

/**
 * Anime and manga appearances, one row per work. The source can hold the
 * same pair twice with different role casing (`MAIN` / `Main`), so each
 * work keeps its most important role.
 */
const appearancesSql = (malId: number) => sql`
  SELECT DISTINCT ON (medium, "malId") medium, "malId", title, role FROM (
    SELECT 'anime' AS medium, a.mal_id AS "malId", a.title, ac.role
    FROM anime_character ac JOIN anime a ON a.mal_id = ac.anime_id
    WHERE ac.character_id = ${malId} AND ${safeAnimeSql(sql`a`)}
    UNION ALL
    SELECT 'manga', m.mal_id, m.title, mc.role
    FROM manga_character mc JOIN manga m ON m.mal_id = mc.manga_id
    WHERE mc.character_id = ${malId} AND ${safeMangaSql(sql`m`)}
  ) credits
  ORDER BY medium, "malId", ${castRoleRankSql(sql`role`)}`

/** Repository of a character's appearances (`safe` floor on both media). */
export const characterAppearancesRepository = {
  /**
   * Loads one page of appearances: main roles first, then by title.
   *
   * @param malId - MyAnimeList character id
   * @param page - Pagination
   * @returns Appearance rows with the raw role
   * @throws {InfraError} On database failure
   */
  async getAppearances(
    malId: number,
    page: PeoplePage
  ): Promise<AppearanceRow[]> {
    try {
      const result = await db.execute<AppearanceRow>(sql`
        SELECT * FROM (${appearancesSql(malId)}) works
        ORDER BY ${castRoleRankSql(sql`role`)}, title, medium, "malId"
        ${pageSql(page)}`)
      return result.rows
    } catch (error) {
      throw dbError('[GET_CHARACTER_APPEARANCES]', { malId }, error)
    }
  },

  /**
   * Counts the appearances.
   *
   * @param malId - MyAnimeList character id
   * @returns Total works
   * @throws {InfraError} On database failure
   */
  async count(malId: number): Promise<number> {
    try {
      const result = await db.execute<{ total: number }>(
        sql`SELECT count(*)::int AS total FROM (${appearancesSql(malId)}) works`
      )
      return result.rows[0]?.total ?? 0
    } catch (error) {
      throw dbError('[COUNT_CHARACTER_APPEARANCES]', { malId }, error)
    }
  },
}
