/**
 * Data access for the taxonomy (genres, themes, demographics) of a printed work.
 *
 * @module domains/manga/repositories/manga-taxonomy/repository
 */
import { db } from '@db/client'
import {
  mangaDemographic,
  mangaGenre,
  mangaTheme,
} from '@db/schemas/manga-relations'
import {
  demographic as demographicTable,
  genre as genreTable,
  theme as themeTable,
} from '@db/schemas/anime-taxonomy'
import { dbError } from '@shared/errors/db-errors'
import { eq } from 'drizzle-orm'
import type {
  MangaDemographicDB,
  MangaGenreDB,
  MangaThemeDB,
} from '@manga/types'

/**
 * Repository for the taxonomy junctions of a work, resolved to their names
 * through the taxonomy tables shared with the anime domain.
 */
export const mangaTaxonomyRepository = {
  /** Loads the genres of a work with their names. */
  async getGenres(
    mangaId: number
  ): Promise<(MangaGenreDB & { name: string })[]> {
    try {
      return await db
        .select({
          mangaId: mangaGenre.mangaId,
          genreId: mangaGenre.genreId,
          name: genreTable.name,
        })
        .from(mangaGenre)
        .innerJoin(genreTable, eq(genreTable.malId, mangaGenre.genreId))
        .where(eq(mangaGenre.mangaId, mangaId))
    } catch (error) {
      throw dbError('[GET_MANGA_GENRES]', { mangaId }, error)
    }
  },

  /** Loads the themes of a work with their names. */
  async getThemes(
    mangaId: number
  ): Promise<(MangaThemeDB & { name: string })[]> {
    try {
      return await db
        .select({
          mangaId: mangaTheme.mangaId,
          themeId: mangaTheme.themeId,
          name: themeTable.name,
        })
        .from(mangaTheme)
        .innerJoin(themeTable, eq(themeTable.malId, mangaTheme.themeId))
        .where(eq(mangaTheme.mangaId, mangaId))
    } catch (error) {
      throw dbError('[GET_MANGA_THEMES]', { mangaId }, error)
    }
  },

  /** Loads the demographics of a work with their names. */
  async getDemographics(
    mangaId: number
  ): Promise<(MangaDemographicDB & { name: string })[]> {
    try {
      return await db
        .select({
          mangaId: mangaDemographic.mangaId,
          demographicId: mangaDemographic.demographicId,
          name: demographicTable.name,
        })
        .from(mangaDemographic)
        .innerJoin(
          demographicTable,
          eq(demographicTable.malId, mangaDemographic.demographicId)
        )
        .where(eq(mangaDemographic.mangaId, mangaId))
    } catch (error) {
      throw dbError('[GET_MANGA_DEMOGRAPHICS]', { mangaId }, error)
    }
  },
}
