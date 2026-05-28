/**
 * Data access for character records.
 *
 * @module domains/anime/repositories/character-repository
 */
import { db } from '@db/client'
import { character } from '@db/schemas/character'
import { eq, inArray } from 'drizzle-orm'
import type { CharacterDB } from '@domains/anime/types'
import { dbError } from '@shared/errors/db-errors'

/**
 * Repository for querying character rows from the database.
 *
 * @remarks
 * **Table:** `character` (PK `mal_id`)
 *
 * @see {@link animeCharacterService}
 * @see {@link mapAnimeCharacters}
 */
export const characterRepository = {
  /**
   * Loads a single character row by MAL ID.
   *
   * @param malId - Character MAL ID
   * @returns {@link CharacterDB} or `undefined`
   *
   * @throws {InfraError} (`[GET_BY_MAL_ID]`)
   */
  async getByMalId(malId: number): Promise<CharacterDB | undefined> {
    try {
      const [result] = await db
        .select()
        .from(character)
        .where(eq(character.malId, malId))
      return result
    } catch (error) {
      throw dbError('[GET_BY_MAL_ID]', { malId }, error)
    }
  },

  /**
   * Loads multiple character rows by MAL IDs.
   *
   * @param malIds - Character MAL IDs from {@link animeCharacterRepository}
   * @returns Matching rows; `[]` when `malIds` is empty (short-circuit, no query)
   *
   * @throws {InfraError} (`[GET_MANY_BY_MAL_IDS]`)
   */
  async getManyByMalIds(malIds: number[]): Promise<CharacterDB[]> {
    try {
      if (!malIds.length) return []
      return db.select().from(character).where(inArray(character.malId, malIds))
    } catch (error) {
      throw dbError('[GET_MANY_BY_MAL_IDS]', { malIds }, error)
    }
  },
}
