/**
 * Data access for anime title synonym records.
 *
 * @module domains/anime/repositories/anime-title-repository
 */
import type { AnimeTitleSynonymDB } from '@domains/anime/types'
import { dbError } from '@shared/errors/db-errors'
import { db } from '@db/client'
import { animeTitleSynonym } from '@db/schemas/anime'
import { eq } from 'drizzle-orm'

/**
 * Repository for querying alternate titles linked to an anime.
 *
 * @remarks
 * **Table:** `anime_title_synonym` (`id`, `title`, `anime_id`)
 *
 * **SQL:** `SELECT id, title, anime_id WHERE anime_id = ?`
 *
 * @see {@link animeFullService}
 * @see {@link mapAnimeToFullDetails}
 */
export const animeTitleRepository = {
  /**
   * Loads title synonym rows for an anime.
   *
   * @param malId - Parent anime MAL ID
   * @returns Synonym rows (`[]` if none)
   *
   * @throws {InfraError} (`[GET_TITLE_SYNONYMS_BY_ANIME_ID]`)
   */
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
