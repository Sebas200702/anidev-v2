import { genre, demographic, theme } from '@/core/db/schemas/anime-taxonomy'
import { db } from '@/core/db/client'
import { eq } from 'drizzle-orm'
import { dbError } from '@/core/errors/db-errors'
import {
  animeGenre,
  animeDemographic,
  animeTheme,
} from '@/core/db/schemas/anime-relations'
import type {
  DemographicDB,
  GenreDB,
  ThemeDB,
} from '@/domains/anime/types/anime-db'

export const animeTaxonomyRepository = {
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
