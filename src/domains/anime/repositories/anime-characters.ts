import { db } from '@/core/db/client'
import { animeCharacter } from '@/core/db/schemas/anime-relations'
import { characterMedia } from '@/core/db/schemas/character-media'
import { dbError } from '@/core/errors/db-errors'
import type {
  AnimeCharacterDB,
  CharacterMediaDB,
} from '@/domains/anime/types/anime-db'
import { eq, inArray } from 'drizzle-orm'

export const animeCharacterRepository = {
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
  async getMediaByCharacterIds(
    characterIds: number[]
  ): Promise<CharacterMediaDB[]> {
    if (!characterIds.length) return []
    try {
      return db
        .select()
        .from(characterMedia)
        .where(inArray(characterMedia.characterId, characterIds))
    } catch (error) {
      throw dbError('[GET_MEDIA_BY_CHARACTER_IDS]', { characterIds }, error)
    }
  },
}
