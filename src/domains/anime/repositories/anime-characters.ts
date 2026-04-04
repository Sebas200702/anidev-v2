import { db } from '@/core/db/client'
import { animeCharacter } from '@/core/db/schemas/anime-relations'
import { dbError } from '@/core/errors/db-errors'
import type { AnimeCharacterDB } from '@/domains/anime/types/anime-db'
import { eq } from 'drizzle-orm'

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
}
