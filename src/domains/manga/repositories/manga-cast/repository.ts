/**
 * Data access for the cast of a printed work and its voice actors.
 *
 * @module domains/manga/repositories/manga-cast/repository
 */
import { db } from '@db/client'
import { mangaCharacter } from '@db/schemas/manga-relations'
import { character } from '@db/schemas/character'
import { characterVoiceActor } from '@db/schemas/character-relations'
import { staff } from '@db/schemas/staff'
import { PROVISIONAL_CHARACTER_NAME_PREFIX } from '@anime/constants'
import { dbError } from '@shared/errors/db-errors'
import { and, asc, eq, inArray, notLike } from 'drizzle-orm'
import type { MangaCharacterDB } from '@manga/types'
import type { MangaVoiceActorRow } from './types'

/**
 * Repository for the cast of a printed work.
 *
 * @remarks
 * Characters and staff are the **shared** entities of the anime domain. Cast
 * rows whose character still carries a provisional scraper name
 * (`Personaje <id>`) are excluded so a placeholder never reaches the app.
 */
export const mangaCastRepository = {
  /**
   * Loads the cast of a work with the character names.
   *
   * @param mangaId - MyAnimeList id of the work
   * @returns Cast rows ordered by role then name
   * @throws {InfraError} On database failure
   */
  async getCharacters(
    mangaId: number
  ): Promise<(MangaCharacterDB & { name: string })[]> {
    try {
      return await db
        .select({
          mangaId: mangaCharacter.mangaId,
          characterId: mangaCharacter.characterId,
          role: mangaCharacter.role,
          name: character.name,
        })
        .from(mangaCharacter)
        .innerJoin(character, eq(character.malId, mangaCharacter.characterId))
        .where(
          and(
            eq(mangaCharacter.mangaId, mangaId),
            notLike(character.name, `${PROVISIONAL_CHARACTER_NAME_PREFIX}%`)
          )
        )
        .orderBy(asc(mangaCharacter.role), asc(character.name))
    } catch (error) {
      throw dbError('[GET_MANGA_CHARACTERS]', { mangaId }, error)
    }
  },

  /**
   * Loads the voice actors of the given characters with the staff names.
   *
   * @param characterIds - Character MAL ids of the cast
   * @returns One row per character, actor and language; `[]` with no ids
   * @throws {InfraError} On database failure
   */
  async getVoiceActors(characterIds: number[]): Promise<MangaVoiceActorRow[]> {
    if (!characterIds.length) return []
    try {
      return await db
        .select({
          characterId: characterVoiceActor.characterId,
          staffId: characterVoiceActor.staffId,
          language: characterVoiceActor.language,
          name: staff.name,
        })
        .from(characterVoiceActor)
        .innerJoin(staff, eq(staff.malId, characterVoiceActor.staffId))
        .where(inArray(characterVoiceActor.characterId, characterIds))
        .orderBy(asc(characterVoiceActor.language), asc(staff.name))
    } catch (error) {
      throw dbError('[GET_MANGA_VOICE_ACTORS]', { characterIds }, error)
    }
  },
}
