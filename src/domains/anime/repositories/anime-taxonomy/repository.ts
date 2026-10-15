/**
 * Data access for anime taxonomy records such as genres and themes.
 *
 * @module domains/anime/repositories/anime-taxonomy/repository
 */
import { genre, demographic, theme } from '@db/schemas/anime-taxonomy'
import { db } from '@db/client'
import { eq, inArray } from 'drizzle-orm'
import { dbError } from '@shared/errors/db-errors'
import {
  animeGenre,
  animeDemographic,
  animeTheme,
} from '@db/schemas/anime-relations'
import type { DemographicDB, GenreDB, ThemeDB } from '@anime/types'

/**
 * Repository for querying taxonomy rows linked to an anime.
 *
 * @remarks
 * Each method inner-joins a join table (`anime_genre`, `anime_demographic`,
 * `anime_theme`) to its taxonomy table and filters by `anime_id`.
 *
 * **Empty vs null:** Always returns `[]` when unlinked; never `null`.
 *
 * @see {@link animeService}
 * @see {@link mapAnimeDetails}
 * @see {@link mapAnimeToFullDetails}
 */
export const animeTaxonomyRepository = {
  /**
   * Loads genres linked to an anime.
   *
   * @param animeId - Parent anime MAL ID
   * @returns `{ malId, name }` per genre
   *
   * @throws {InfraError} (`[GET_GENRES_BY_ANIME_ID]`)
   */
  async getGenresByAnimeId(animeId: number): Promise<GenreDB[]> {
    try {
      return await db
        .select({
          malId: genre.malId,
          name: genre.name,
        })
        .from(genre)
        .innerJoin(animeGenre, eq(animeGenre.genreId, genre.malId))
        .where(eq(animeGenre.animeId, animeId))
    } catch (error) {
      throw dbError('[GET_GENRES_BY_ANIME_ID]', { animeId }, error)
    }
  },
  /**
   * Loads genres for several anime in one query.
   *
   * @param animeIds - Parent anime MAL IDs
   * @returns Genre rows each carrying its `animeId` for grouping
   *
   * @throws {InfraError} (`[GET_GENRES_BY_ANIME_IDS]`)
   */
  async getGenresByAnimeIds(
    animeIds: number[]
  ): Promise<(GenreDB & { animeId: number })[]> {
    try {
      if (animeIds.length === 0) return []
      return await db
        .select({
          malId: genre.malId,
          name: genre.name,
          animeId: animeGenre.animeId,
        })
        .from(genre)
        .innerJoin(animeGenre, eq(animeGenre.genreId, genre.malId))
        .where(inArray(animeGenre.animeId, animeIds))
    } catch (error) {
      throw dbError('[GET_GENRES_BY_ANIME_IDS]', { animeIds }, error)
    }
  },

  /**
   * Loads demographics linked to an anime.
   *
   * @param animeId - Parent anime MAL ID
   * @returns `{ malId, name }` per demographic (e.g. Shounen, Josei)
   *
   * @throws {InfraError} (`[GET_DEMOGRAPHICS_BY_ANIME_ID]`)
   */
  async getDemographicsByAnimeId(animeId: number): Promise<DemographicDB[]> {
    try {
      return await db
        .select({
          malId: demographic.malId,
          name: demographic.name,
        })
        .from(demographic)
        .innerJoin(
          animeDemographic,
          eq(animeDemographic.demographicId, demographic.malId)
        )
        .where(eq(animeDemographic.animeId, animeId))
    } catch (error) {
      throw dbError('[GET_DEMOGRAPHICS_BY_ANIME_ID]', { animeId }, error)
    }
  },

  /**
   * Loads themes linked to an anime.
   *
   * @param animeId - Parent anime MAL ID
   * @returns `{ malId, name }` per theme
   *
   * @throws {InfraError} (`[GET_THEMES_BY_ANIME_ID]`)
   */
  async getThemesByAnimeId(animeId: number): Promise<ThemeDB[]> {
    try {
      return await db
        .select({
          malId: theme.malId,
          name: theme.name,
        })
        .from(theme)
        .innerJoin(animeTheme, eq(animeTheme.themeId, theme.malId))
        .where(eq(animeTheme.animeId, animeId))
    } catch (error) {
      throw dbError('[GET_THEMES_BY_ANIME_ID]', { animeId }, error)
    }
  },
}
