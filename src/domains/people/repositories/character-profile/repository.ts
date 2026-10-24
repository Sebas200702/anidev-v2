/**
 * Data access for a character profile and its voice actors.
 *
 * @module domains/people/repositories/character-profile/repository
 */
import { db } from '@db/client'
import { character } from '@db/schemas/character'
import { characterVoiceActor } from '@db/schemas/character-relations'
import { staff } from '@db/schemas/staff'
import { dbError } from '@shared/errors/db-errors'
import { PROVISIONAL_NAME_PATTERN } from '@people/repositories/shared/sql'
import type { CharacterProfileRow, VoiceActorRow } from '@people/types'
import { and, asc, eq, notLike, sql } from 'drizzle-orm'

/** Repository for one character and its voice credits. */
export const characterProfileRepository = {
  /**
   * Loads the character, unless it still has a provisional name.
   *
   * @param malId - MyAnimeList character id
   * @returns The row, or `undefined`
   * @throws {InfraError} On database failure
   */
  async getCharacter(malId: number): Promise<CharacterProfileRow | undefined> {
    try {
      const rows = await db
        .select({
          malId: character.malId,
          name: character.name,
          nameKanji: character.nameKanji,
          favorites: character.favorites,
          about: character.about,
          gender: character.gender,
          dateOfBirth: character.dateOfBirth,
          bloodType: character.bloodType,
          height: character.height,
          weight: character.weight,
          age: character.age,
        })
        .from(character)
        .where(
          and(
            eq(character.malId, malId),
            notLike(character.name, PROVISIONAL_NAME_PATTERN)
          )
        )
        .limit(1)
      return rows[0]
    } catch (error) {
      throw dbError('[GET_CHARACTER]', { malId }, error)
    }
  },

  /**
   * Loads the voice actors of a character, Japanese first.
   *
   * @param malId - MyAnimeList character id
   * @returns One row per actor and language
   * @throws {InfraError} On database failure
   */
  async getVoiceActors(malId: number): Promise<VoiceActorRow[]> {
    try {
      return await db
        .select({
          language: characterVoiceActor.language,
          staffId: characterVoiceActor.staffId,
          name: staff.name,
        })
        .from(characterVoiceActor)
        .innerJoin(staff, eq(staff.malId, characterVoiceActor.staffId))
        .where(eq(characterVoiceActor.characterId, malId))
        .orderBy(
          sql`${characterVoiceActor.language} <> 'Japanese'`,
          asc(characterVoiceActor.language),
          asc(staff.name)
        )
    } catch (error) {
      throw dbError('[GET_CHARACTER_VOICES]', { malId }, error)
    }
  },
}
