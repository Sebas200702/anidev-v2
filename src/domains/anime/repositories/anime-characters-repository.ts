/**
 * Data access for anime-character join records.
 *
 * @module domains/anime/repositories/anime-characters-repository
 */
import { db } from '@db/client'
import { animeCharacter } from '@db/schemas/anime-relations'
import { dbError } from '@shared/errors/db-errors'
import type { AnimeCharacterDB } from '@domains/anime/types'
import { eq } from 'drizzle-orm'

/**
 * Repository for querying anime-character relations.
 *
 * @remarks
 * **Table:** `anime_character` (`anime_id`, `character_id`, `role`)
 *
 * **SQL:** `SELECT * WHERE anime_id = ?`
 *
 * **Empty vs null:** `[]` when no cast entries; character bodies come from
 * {@link characterRepository}.
 *
 * @see {@link animeCharacterService}
 * @see {@link mapAnimeCharacters}
 */
export const animeCharacterRepository = {
  /**
   * Loads character references linked to an anime.
   *
   * @param animeId - Parent anime MAL ID (`anime_character.anime_id`)
   * @returns Join rows with `characterId` and cast `role` (Main, Supporting, etc.)
   *
   * @throws {InfraError} On database failure (`[GET_CHARACTER_REFS_BY_ANIME_ID]`)
   */
  async getCharacterRefsByAnimeId(
    animeId: number
  ): Promise<AnimeCharacterDB[]> {
    try {
      return db
        .select()
        .from(animeCharacter)
        .where(eq(animeCharacter.animeId, animeId))
    } catch (error) {
      throw dbError('[GET_CHARACTER_REFS_BY_ANIME_ID]', { animeId }, error)
    }
  },
}
