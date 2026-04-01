import { db } from '@/core/db/client'
import { anime } from '@/core/db/schemas/anime'
import { animeGenre } from '@/core/db/schemas/anime-relations'
import { genre as genreTable } from '@/core/db/schemas/anime-taxonomy'
import { dbError } from '@/core/errors/db-errors'
import type { AnimeDB } from '@/domains/anime/types/anime-db'
import type { AnimeFilters } from '@/domains/anime/types/anime-list'
import { and, countDistinct, eq, inArray } from 'drizzle-orm'

export const animeListRepository = {
  async getAnimeList({
    genre,
    status,
    rating,
    type,
    page,
    limit,
    year,
  }: AnimeFilters): Promise<AnimeDB[]> {
    try {
      const filters = []

      if (year) {
        filters.push(eq(anime.year, year))
      }

      if (status?.length) {
        filters.push(inArray(anime.status, status))
      }

      if (rating?.length) {
        filters.push(inArray(anime.rating, rating))
      }

      if (type?.length) {
        filters.push(inArray(anime.type, type))
      }

      const result = await db
        .select({
          anime,
        })
        .from(anime)
        .innerJoin(animeGenre, eq(animeGenre.animeId, anime.malId))
        .innerJoin(genreTable, eq(genreTable.malId, animeGenre.genreId))
        .where(
          and(
            ...filters,
            ...(genre?.length ? [inArray(genreTable.name, genre)] : [])
          )
        )
        .limit(limit)
        .offset((page - 1) * limit)

      return result.map((row) => row.anime)
    } catch (error) {
      throw dbError('[GET_ANIME_LIST]', {}, error)
    }
  },
  async getAnimeListCount({
    genre,
    status,
    rating,
    type,
    year,
  }: Omit<AnimeFilters, 'page' | 'limit'>): Promise<number> {
    try {
      const filters = []

      if (year) {
        filters.push(eq(anime.year, year))
      }

      if (status?.length) {
        filters.push(inArray(anime.status, status))
      }

      if (rating?.length) {
        filters.push(inArray(anime.rating, rating))
      }

      if (type?.length) {
        filters.push(inArray(anime.type, type))
      }

      const result = await db
        .select({
          count: countDistinct(anime.malId),
        })
        .from(anime)
        .innerJoin(animeGenre, eq(animeGenre.animeId, anime.malId))
        .innerJoin(genreTable, eq(genreTable.malId, animeGenre.genreId))
        .where(
          and(
            ...filters,
            ...(genre?.length ? [inArray(genreTable.name, genre)] : [])
          )
        )

      return result[0]?.count ?? 0
    } catch (error) {
      throw dbError('[GET_ANIME_LIST_COUNT]', {}, error)
    }
  },
}
