import type { AnimeTitleSynonymDB } from '@/domains/anime/types/anime-db'
import { dbError } from '@/core/errors/db-errors'
import { db } from '@/core/db/client'
import { animeTitleSynonym } from '@/core/db/schemas/anime'
import { eq } from 'drizzle-orm'

export const animeTitleRepository = {
  async getTitleSynonymsByAnimeId(
    malId: number
  ): Promise<AnimeTitleSynonymDB[]> {
    try {
      return await db
        .select({
          id: animeTitleSynonym.id,
          title: animeTitleSynonym.title,
          animeId: animeTitleSynonym.animeId,
        })
        .from(animeTitleSynonym)
        .where(eq(animeTitleSynonym.animeId, malId))
    } catch (error) {
      throw dbError('[GET_TITLE_SYNONYMS_BY_ANIME_ID]', { malId }, error)
    }
  },
}
