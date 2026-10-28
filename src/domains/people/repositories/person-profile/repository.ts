/**
 * Data access for a person profile and the size of its credit lists.
 *
 * @module domains/people/repositories/person-profile/repository
 */
import { db } from '@db/client'
import { staff } from '@db/schemas/staff'
import { dbError } from '@shared/errors/db-errors'
import { voicedCharactersSql } from '@people/repositories/person-voices'
import { creditedWorksSql } from '@people/repositories/person-credits'
import type { PersonCountsRow, PersonProfileRow } from '@people/types'
import { eq, sql } from 'drizzle-orm'

/** Repository for one person and its credit counts. */
export const personProfileRepository = {
  /**
   * Loads the person row.
   *
   * @param malId - MyAnimeList person id
   * @returns The row, or `undefined`
   * @throws {InfraError} On database failure
   */
  async getPerson(malId: number): Promise<PersonProfileRow | undefined> {
    try {
      const rows = await db
        .select({
          malId: staff.malId,
          name: staff.name,
          favorites: staff.favorites,
          givenName: staff.givenName,
          familyName: staff.familyName,
          birthday: staff.birthday,
          gender: staff.gender,
          about: staff.about,
        })
        .from(staff)
        .where(eq(staff.malId, malId))
        .limit(1)
      return rows[0]
    } catch (error) {
      throw dbError('[GET_PERSON]', { malId }, error)
    }
  },

  /**
   * Counts voice roles, anime/manga credits and music themes with the same
   * predicates as their lists, so `counts` matches each list `total`.
   *
   * @param malId - MyAnimeList person id
   * @returns The four counts
   * @throws {InfraError} On database failure
   */
  async getCounts(malId: number): Promise<PersonCountsRow> {
    try {
      const result = await db.execute<PersonCountsRow>(sql`SELECT
        (SELECT count(*) FROM (${voicedCharactersSql(malId)}) v)::int AS voices,
        (SELECT count(*) FROM (${creditedWorksSql(malId, 'anime')}) a)::int AS "animeCredits",
        (SELECT count(*) FROM (${creditedWorksSql(malId, 'manga')}) m)::int AS "mangaCredits",
        (SELECT count(DISTINCT ma.music_id) FROM music_artist ma
          JOIN artist ar ON ar.id = ma.artist_id WHERE ar.mal_id = ${malId})::int AS music`)
      return (
        result.rows[0] ?? {
          voices: 0,
          animeCredits: 0,
          mangaCredits: 0,
          music: 0,
        }
      )
    } catch (error) {
      throw dbError('[GET_PERSON_COUNTS]', { malId }, error)
    }
  },
}
