/**
 * Data access for the alternative titles of a printed work.
 *
 * @module domains/manga/repositories/manga-titles/repository
 */
import { db } from '@db/client'
import { mangaTitleSynonym } from '@db/schemas/manga'
import { dbError } from '@shared/errors/db-errors'
import { asc, eq } from 'drizzle-orm'

/** Repository for the title synonyms of a work (`manga_title_synonym`). */
export const mangaTitlesRepository = {
  /**
   * Loads the title synonyms of a work.
   *
   * @param mangaId - MyAnimeList id of the work
   * @returns Synonyms in alphabetical order; `[]` when there are none
   * @throws {InfraError} On database failure
   */
  async getSynonyms(mangaId: number): Promise<string[]> {
    try {
      const rows = await db
        .select({ title: mangaTitleSynonym.title })
        .from(mangaTitleSynonym)
        .where(eq(mangaTitleSynonym.mangaId, mangaId))
        .orderBy(asc(mangaTitleSynonym.title))
      return rows.map(({ title }) => title)
    } catch (error) {
      throw dbError('[GET_MANGA_SYNONYMS]', { mangaId }, error)
    }
  },
}
