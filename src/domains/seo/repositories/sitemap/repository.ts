/**
 * Data access for the sitemap segments.
 *
 * @module domains/seo/repositories/sitemap/repository
 * @remarks
 * Only content that passes the default (`safe`) parental floor is listed:
 * anime with an adult rating and adult genres never reach a sitemap.
 */
import { db } from '@db/client'
import { anime } from '@db/schemas/anime'
import { genre } from '@db/schemas/anime-taxonomy'
import { ADULT_RATINGS } from '@anime/constants'
import { ADULT_MANGA_GENRES } from '@manga/constants'
import { dbError } from '@shared/errors/db-errors'
import { asc, count, isNull, notInArray, or } from 'drizzle-orm'
import type { SitemapAnimeRow } from './types'

const safeAnime = or(
  isNull(anime.rating),
  notInArray(anime.rating, [...ADULT_RATINGS])
)

/** Repository of the rows behind each sitemap segment. */
export const sitemapRepository = {
  /**
   * Counts the anime eligible for the sitemap.
   *
   * @returns Number of `safe` anime
   * @throws {InfraError} On database failure
   */
  async countAnime(): Promise<number> {
    try {
      const rows = await db
        .select({ value: count() })
        .from(anime)
        .where(safeAnime)
      return rows[0]?.value ?? 0
    } catch (error) {
      throw dbError('[COUNT_SITEMAP_ANIME]', {}, error)
    }
  },

  /**
   * Loads one page of eligible anime, ordered by MAL id.
   *
   * @param offset - Rows to skip
   * @param limit - Page size
   * @returns `{ malId, title }` rows
   * @throws {InfraError} On database failure
   */
  async getAnimePage(
    offset: number,
    limit: number
  ): Promise<SitemapAnimeRow[]> {
    try {
      return await db
        .select({ malId: anime.malId, title: anime.title })
        .from(anime)
        .where(safeAnime)
        .orderBy(asc(anime.malId))
        .limit(limit)
        .offset(offset)
    } catch (error) {
      throw dbError('[GET_SITEMAP_ANIME]', { offset, limit }, error)
    }
  },

  /**
   * Loads the genre names that can be browsed, without adult genres.
   *
   * @returns Genre names in alphabetical order
   * @throws {InfraError} On database failure
   */
  async getGenreNames(): Promise<string[]> {
    try {
      const rows = await db
        .select({ name: genre.name })
        .from(genre)
        .where(notInArray(genre.name, [...ADULT_MANGA_GENRES]))
        .orderBy(asc(genre.name))
      return rows.map(({ name }) => name)
    } catch (error) {
      throw dbError('[GET_SITEMAP_GENRES]', {}, error)
    }
  },
}
