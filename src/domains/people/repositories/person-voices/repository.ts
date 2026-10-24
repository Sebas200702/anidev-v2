/**
 * Data access for the characters a person voices.
 *
 * @module domains/people/repositories/person-voices/repository
 */
import { db } from '@db/client'
import { VOICE_ROLE_ANIME_LIMIT } from '@people/constants'
import { dbError } from '@shared/errors/db-errors'
import {
  pageSql,
  PROVISIONAL_NAME_PATTERN,
  safeAnimeSql,
} from '@people/repositories/shared/sql'
import type { PeoplePage, PersonVoiceRow } from '@people/types'
import { sql, type SQL } from 'drizzle-orm'

/**
 * Voice credits of a person: one row per character and language. Only real
 * names, and only characters with at least one `safe` anime, so an adult-only
 * character never surfaces through a voice actor.
 */
export const voicedCharactersSql = (
  malId: number,
  language?: string
): SQL => sql`
  SELECT cva.character_id, cva.language, c.name, c.favorites
  FROM character_voice_actor cva JOIN character c ON c.mal_id = cva.character_id
  WHERE cva.staff_id = ${malId}
    ${language ? sql`AND cva.language = ${language}` : sql``}
    AND c.name NOT LIKE ${PROVISIONAL_NAME_PATTERN}
    AND EXISTS (SELECT 1 FROM anime_character ac JOIN anime a ON a.mal_id = ac.anime_id
      WHERE ac.character_id = cva.character_id AND ${safeAnimeSql(sql`a`)})`

/** Up to {@link VOICE_ROLE_ANIME_LIMIT} `safe` anime of a character, most members first. */
const characterAnimeSql = sql`(SELECT json_agg(json_build_object('malId', t.mal_id, 'title', t.title))
  FROM (SELECT DISTINCT a.mal_id, a.title, a.members FROM anime_character ac
    JOIN anime a ON a.mal_id = ac.anime_id
    WHERE ac.character_id = v.character_id AND ${safeAnimeSql(sql`a`)}
    ORDER BY a.members DESC NULLS LAST, a.mal_id LIMIT ${VOICE_ROLE_ANIME_LIMIT}) t)`

/** Repository of a person's voice roles. */
export const personVoicesRepository = {
  /**
   * Loads one page of voiced characters, most favorited first.
   *
   * @param malId - MyAnimeList person id
   * @param page - Pagination plus optional `language`
   * @returns Rows with the character, language and up to 3 anime
   * @throws {InfraError} On database failure
   */
  async getVoices(
    malId: number,
    { language, ...page }: PeoplePage & { language?: string }
  ): Promise<PersonVoiceRow[]> {
    try {
      const result = await db.execute<PersonVoiceRow>(sql`
        SELECT v.character_id AS "characterId", v.name AS "characterName",
          v.language, ${characterAnimeSql} AS anime
        FROM (${voicedCharactersSql(malId, language)}) v
        ORDER BY v.favorites DESC NULLS LAST, v.character_id, v.language
        ${pageSql(page)}`)
      return result.rows
    } catch (error) {
      throw dbError('[GET_PERSON_VOICES]', { malId }, error)
    }
  },

  /**
   * Counts voice roles (optionally one language).
   *
   * @param malId - MyAnimeList person id
   * @param language - Optional language filter
   * @returns Total voice roles
   * @throws {InfraError} On database failure
   */
  async count(malId: number, language?: string): Promise<number> {
    try {
      const result = await db.execute<{ total: number }>(
        sql`SELECT count(*)::int AS total FROM (${voicedCharactersSql(malId, language)}) v`
      )
      return result.rows[0]?.total ?? 0
    } catch (error) {
      throw dbError('[COUNT_PERSON_VOICES]', { malId }, error)
    }
  },
}
