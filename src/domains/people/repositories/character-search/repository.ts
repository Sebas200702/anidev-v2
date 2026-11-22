/**
 * Data access for the character name search.
 *
 * @module domains/people/repositories/character-search/repository
 */
import { db } from '@db/client'
import { animeCharacter } from '@db/schemas/anime-entity-relations'
import { character } from '@db/schemas/character'
import { safeAnimeIdsByTitle } from '@anime/repositories/anime-title-match'
import { dbError } from '@shared/errors/db-errors'
import {
  containsPattern,
  PROVISIONAL_NAME_PATTERN,
} from '@people/repositories/shared/sql'
import type { CharacterCardRow, PeopleSearchQuery } from '@people/types'
import { and, asc, count, desc, ilike, notLike, or, sql } from 'drizzle-orm'

/**
 * Characters whose name matches, plus the cast of the (non-adult) anime whose
 * title matches. A `UNION` keeps each branch on its own trigram index; an
 * `OR` across both would scan the whole character table.
 */
const matchingCharacterIds = (query: string) => sql`(
  ${db
    .select({ id: character.malId })
    .from(character)
    .where(
      or(
        ilike(character.name, containsPattern(query)),
        ilike(character.nameKanji, containsPattern(query))
      )
    )}
  UNION
  ${db
    .select({ id: animeCharacter.characterId })
    .from(animeCharacter)
    .where(sql`${animeCharacter.animeId} IN ${safeAnimeIdsByTitle(query)}`)}
)`

const searchWhere = (query: string) =>
  and(
    sql`${character.malId} IN ${matchingCharacterIds(query)}`,
    notLike(character.name, PROVISIONAL_NAME_PATTERN)
  )

/**
 * Repository for searching characters by name or by the title of a non-adult
 * anime they appear in (GIN `pg_trgm` indexes on both).
 * Provisional names are never returned.
 */
export const characterSearchRepository = {
  /**
   * Loads one page of matches, most favorited first.
   *
   * @param query - Validated `{ query, page, limit }`
   * @returns Card rows
   * @throws {InfraError} On database failure
   */
  async search({
    query,
    page,
    limit,
  }: PeopleSearchQuery): Promise<CharacterCardRow[]> {
    try {
      return await db
        .select({
          malId: character.malId,
          name: character.name,
          nameKanji: character.nameKanji,
          favorites: character.favorites,
        })
        .from(character)
        .where(searchWhere(query))
        .orderBy(
          sql`${desc(character.favorites)} NULLS LAST`,
          asc(character.malId)
        )
        .limit(limit)
        .offset((page - 1) * limit)
    } catch (error) {
      throw dbError('[SEARCH_CHARACTERS]', { page, limit }, error)
    }
  },

  /**
   * Counts the matches of a search.
   *
   * @param query - Search term
   * @returns Total matches
   * @throws {InfraError} On database failure
   */
  async count(query: string): Promise<number> {
    try {
      const rows = await db
        .select({ value: count() })
        .from(character)
        .where(searchWhere(query))
      return rows[0]?.value ?? 0
    } catch (error) {
      throw dbError('[COUNT_CHARACTERS]', {}, error)
    }
  },
}
