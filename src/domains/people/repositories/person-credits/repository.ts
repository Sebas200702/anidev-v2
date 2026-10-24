/**
 * Data access for a person's staff credits.
 *
 * @module domains/people/repositories/person-credits/repository
 */
import { db } from '@db/client'
import { dbError } from '@shared/errors/db-errors'
import {
  pageSql,
  safeAnimeSql,
  safeMangaSql,
} from '@people/repositories/shared/sql'
import type { PeopleMedium, PeoplePage, PersonCreditRow } from '@people/types'
import { sql, type SQL } from 'drizzle-orm'

/**
 * One row per credited work with every position held (`safe` floor applied).
 * Columns: `medium`, `malId`, `title`, `year`, `positions`.
 */
export const creditedWorksSql = (malId: number, medium: PeopleMedium): SQL =>
  medium === 'anime'
    ? sql`SELECT 'anime' AS medium, w.mal_id AS "malId", w.title, w.year,
        array_agg(DISTINCT s.role ORDER BY s.role) AS positions
      FROM anime_staff s JOIN anime w ON w.mal_id = s.anime_id
      WHERE s.staff_id = ${malId} AND ${safeAnimeSql(sql`w`)}
      GROUP BY w.mal_id, w.title, w.year`
    : sql`SELECT 'manga' AS medium, w.mal_id AS "malId", w.title, w.year,
        array_agg(DISTINCT s.role ORDER BY s.role) AS positions
      FROM manga_staff s JOIN manga w ON w.mal_id = s.manga_id
      WHERE s.staff_id = ${malId} AND ${safeMangaSql(sql`w`)}
      GROUP BY w.mal_id, w.title, w.year`

/** Repository of a person's staff credits. */
export const personCreditsRepository = {
  /**
   * Loads one page of credited works, newest first.
   *
   * @param malId - MyAnimeList person id
   * @param options - Pagination and medium
   * @returns Credit rows with their positions
   * @throws {InfraError} On database failure
   */
  async getCredits(
    malId: number,
    { medium, ...page }: PeoplePage & { medium: PeopleMedium }
  ): Promise<PersonCreditRow[]> {
    try {
      const result = await db.execute<PersonCreditRow>(sql`
        SELECT medium, "malId", title, positions
        FROM (${creditedWorksSql(malId, medium)}) works
        ORDER BY year DESC NULLS LAST, title, "malId"
        ${pageSql(page)}`)
      return result.rows
    } catch (error) {
      throw dbError('[GET_PERSON_CREDITS]', { malId, medium }, error)
    }
  },

  /**
   * Counts the credited works of a medium.
   *
   * @param malId - MyAnimeList person id
   * @param medium - `anime` or `manga`
   * @returns Total works
   * @throws {InfraError} On database failure
   */
  async count(malId: number, medium: PeopleMedium): Promise<number> {
    try {
      const result = await db.execute<{ total: number }>(
        sql`SELECT count(*)::int AS total FROM (${creditedWorksSql(malId, medium)}) works`
      )
      return result.rows[0]?.total ?? 0
    } catch (error) {
      throw dbError('[COUNT_PERSON_CREDITS]', { malId, medium }, error)
    }
  },

  /**
   * Loads the ids of the music artists linked to the person (`artist.mal_id`).
   *
   * @param malId - MyAnimeList person id
   * @returns Artist ids; `[]` when the person is not a credited artist
   * @throws {InfraError} On database failure
   */
  async getArtistIds(malId: number): Promise<number[]> {
    try {
      const result = await db.execute<{ id: number }>(
        sql`SELECT id FROM artist WHERE mal_id = ${malId}`
      )
      return result.rows.map(({ id }) => id)
    } catch (error) {
      throw dbError('[GET_PERSON_ARTISTS]', { malId }, error)
    }
  },
}
