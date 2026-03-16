import type { AnimeExternalDB } from '@/domains/anime/types/anime-db'
import { dbError } from '@/core/errors/db-errors'
import { db } from '@/core/db/client'
import { animeExternalIds } from '@/core/db/schemas/anime-external'
import { eq } from 'drizzle-orm'

export const animeExternalRepository = {
  async getExternalLinksByAnimeId(malId: number): Promise<AnimeExternalDB> {
    try {
      const [result] = await db
        .select()
        .from(animeExternalIds)
        .where(eq(animeExternalIds.animeId, malId))
      return result
    } catch (error) {
      throw dbError('[GET_EXTERNAL_LINKS_BY_ANIME_ID]', { malId }, error)
    }
  },
}
