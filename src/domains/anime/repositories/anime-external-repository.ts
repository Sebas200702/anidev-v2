/**
 * Data access for anime external identifier records.
 *
 * @module domains/anime/repositories/anime-external-repository
 */
import type { AnimeExternalDB } from '@domains/anime/types'
import { dbError } from '@shared/errors/db-errors'
import { db } from '@db/client'
import { animeExternalIds } from '@db/schemas/anime-external'
import { eq } from 'drizzle-orm'

/**
 * Repository for querying external platform identifiers for anime.
 *
 * @remarks
 * **Table:** `anime_external_ids` (`anime_id`, `kitsu_id`, `tvdb_id`, `anime_themes_slug`, …)
 *
 * **SQL:** `SELECT * WHERE anime_id = ?` (limit 1)
 *
 * **Empty vs null:** Returns `undefined` when no external row exists; mapper
 * {@link mapExternalIds} tolerates missing optional platform fields.
 *
 * @see {@link animeFullService}
 * @see {@link mapExternalIds}
 */
export const animeExternalRepository = {
  /**
   * Loads external identifier links for an anime.
   *
   * @param malId - Parent anime MAL ID (`anime_external_ids.anime_id`)
   * @returns {@link AnimeExternalDB} row or `undefined` if never synced
   *
   * @throws {InfraError} On database failure (`[GET_EXTERNAL_LINKS_BY_ANIME_ID]`)
   */
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
