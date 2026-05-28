import { db } from '@/core/db/client'
import { anime } from '@/core/db/schemas/anime'
import { animeGenre } from '@/core/db/schemas/anime-relations'
import { genre as genreTable } from '@/core/db/schemas/anime-taxonomy'
import { dbError } from '@/core/errors/db-errors'
import { normalizeString } from '@/core/utils/string/normalize'
import type { AnimeDB } from '@/domains/anime/types/anime-db'
import type { AnimeFilters } from '@/domains/anime/types/anime-list'
import { and, countDistinct, eq, inArray, sql, type SQL } from 'drizzle-orm'
export const buildAnimeListFilters = ({
  genre,
  status,
  rating,
  type,
  year,
  query,
}: Omit<AnimeFilters, 'page' | 'limit'>): SQL[] => {
  const filters: SQL[] = []

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

  if (genre?.length) {
    filters.push(inArray(genreTable.name, genre))
  }

  if (query?.trim()) {
    const normalizedQuery = normalizeString({
      string: query,
      removeSpaces: true,
      separator: '',
      toLowerCase: true,
    })

    const queryPattern = `%${normalizedQuery}%`

    const normalizedTitle = sql`REPLACE(LOWER(${anime.title}), ' ', '')`
    const normalizedTitleEng = sql`REPLACE(LOWER(COALESCE(${anime.titleEnglish}, '')), ' ', '')`
    const normalizedTitleJpn = sql`REPLACE(LOWER(COALESCE(${anime.titleJapanese}, '')), ' ', '')`

    filters.push(
      sql`(
        ${normalizedTitle} LIKE ${queryPattern}
        OR ${normalizedTitleEng} LIKE ${queryPattern}
        OR ${normalizedTitleJpn} LIKE ${queryPattern}
      )`
    )
  }

  return filters
}

export const animeListRepository = {
  async getAnimeList({
    page,
    limit,
    ...filterParams
  }: AnimeFilters): Promise<AnimeDB[]> {
    try {
      const whereConditions = buildAnimeListFilters(filterParams)

      const result = await db
        .selectDistinct({ anime })
        .from(anime)
        .leftJoin(animeGenre, eq(animeGenre.animeId, anime.malId))
        .leftJoin(genreTable, eq(genreTable.malId, animeGenre.genreId))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .limit(limit)
        .offset((page - 1) * limit)

      return result.map(({ anime: animeRow }) => animeRow)
    } catch (error) {
      throw dbError('[GET_ANIME_LIST]', {}, error)
    }
  },
  async getAnimeListCount(
    filterParams: Omit<AnimeFilters, 'page' | 'limit'>
  ): Promise<number> {
    try {
      const whereConditions = buildAnimeListFilters(filterParams)

      const result = await db
        .selectDistinct({ count: countDistinct(anime.malId) })
        .from(anime)
        .leftJoin(animeGenre, eq(animeGenre.animeId, anime.malId))
        .leftJoin(genreTable, eq(genreTable.malId, animeGenre.genreId))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

      return result[0]?.count ?? 0
    } catch (error) {
      throw dbError('[GET_ANIME_LIST_COUNT]', {}, error)
    }
  },
}
