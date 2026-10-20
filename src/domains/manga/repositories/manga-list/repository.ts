/**
 * Data access for the printed-media (manga) list queries.
 *
 * @module domains/manga/repositories/manga-list/repository
 */
import { db } from '@db/client'
import { manga } from '@db/schemas/manga'
import { mangaTitleSynonym } from '@db/schemas/manga'
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
import {
  and,
  asc,
  countDistinct,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from 'drizzle-orm'
import type { MangaDB, MangaFilters } from '@manga/types'

/**
 * Repository for querying filtered and paginated printed-media lists.
 *
 * @remarks
 * **Tables:** `manga` LEFT JOIN `manga_genre` LEFT JOIN `genre`
 *
 * The list mirrors the anime list: `LIMIT`/`OFFSET` pagination, a distinct
 * count for the total, and a whitelist of sortable fields. Taxonomy filters
 * arrive as **names** ("Action") and are resolved to the MAL ids of the
 * junction through a subquery.
 */
export const mangaListRepository = {
  /**
   * Loads a paginated printed-media list matching the provided filters.
   *
   * @param filters - Normalized {@link MangaFilters} including `page` and `limit`
   * @returns Distinct {@link MangaDB} rows for the current page
   * @throws {InfraError} On database failure
   */
  async getMangaList({
    page,
    limit,
    ...filters
  }: MangaFilters): Promise<MangaDB[]> {
    try {
      const conditions = []

      if (filters.type?.length) {
        conditions.push(inArray(manga.type, filters.type))
      }
      if (filters.genre?.length) {
        conditions.push(
          inArray(
            manga.malId,
            db
              .select({ id: mangaGenre.mangaId })
              .from(mangaGenre)
              .innerJoin(genreTable, eq(genreTable.malId, mangaGenre.genreId))
              .where(inArray(genreTable.name, filters.genre))
          )
        )
      }
      if (filters.theme?.length) {
        conditions.push(
          inArray(
            manga.malId,
            db
              .select({ id: mangaTheme.mangaId })
              .from(mangaTheme)
              .innerJoin(themeTable, eq(themeTable.malId, mangaTheme.themeId))
              .where(inArray(themeTable.name, filters.theme))
          )
        )
      }
      if (filters.demographic?.length) {
        conditions.push(
          inArray(
            manga.malId,
            db
              .select({ id: mangaDemographic.mangaId })
              .from(mangaDemographic)
              .innerJoin(
                demographicTable,
                eq(demographicTable.malId, mangaDemographic.demographicId)
              )
              .where(inArray(demographicTable.name, filters.demographic))
          )
        )
      }
      if (filters.status?.length) {
        conditions.push(inArray(manga.status, filters.status))
      }
      if (filters.year !== undefined) {
        conditions.push(eq(manga.year, filters.year))
      }
      if (filters.scoreMin !== undefined) {
        conditions.push(
          sql`${manga.score} IS NOT NULL AND ${manga.score} >= ${filters.scoreMin}`
        )
      }
      if (filters.scoreMax !== undefined) {
        conditions.push(
          sql`${manga.score} IS NOT NULL AND ${manga.score} <= ${filters.scoreMax}`
        )
      }
      if (filters.query?.trim()) {
        // Índice-backed: los GIN de pg_trgm sobre estas columnas y sobre
        // `manga_title_synonym.title` aceleran el `ILIKE '%q%'`.
        const term = `%${filters.query.trim()}%`
        conditions.push(
          or(
            ilike(manga.title, term),
            ilike(manga.titleEnglish, term),
            ilike(manga.titleJapanese, term),
            inArray(
              manga.malId,
              db
                .select({ id: mangaTitleSynonym.mangaId })
                .from(mangaTitleSynonym)
                .where(ilike(mangaTitleSynonym.title, term))
            )
          )
        )
      }

      const orderBy =
        filters.sort === 'title'
          ? filters.order === 'asc'
            ? [asc(manga.title)]
            : [desc(manga.title)]
          : filters.sort === 'year'
            ? filters.order === 'asc'
              ? [asc(manga.year)]
              : [desc(manga.year)]
            : filters.order === 'asc'
              ? [asc(manga.score)]
              : [desc(manga.score)]

      const rows = await db
        .selectDistinct({ manga })
        .from(manga)
        .leftJoin(mangaGenre, eq(mangaGenre.mangaId, manga.malId))
        .leftJoin(genreTable, eq(genreTable.malId, mangaGenre.genreId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(...orderBy)
        .limit(limit)
        .offset((page - 1) * limit)

      return rows.map((row) => row.manga)
    } catch (error) {
      throw dbError('[GET_MANGA_LIST]', { page, limit }, error)
    }
  },

  /**
   * Counts the printed-media matching the provided filters.
   *
   * @param filters - Normalized {@link MangaFilters} (without pagination)
   * @returns Total number of matching works (never `null`)
   * @throws {InfraError} On database failure
   */
  async countMangaList(filters: MangaFilters): Promise<number> {
    try {
      const conditions = []
      if (filters.type?.length) {
        conditions.push(inArray(manga.type, filters.type))
      }
      if (filters.status?.length) {
        conditions.push(inArray(manga.status, filters.status))
      }
      if (filters.year !== undefined) {
        conditions.push(eq(manga.year, filters.year))
      }

      const result = await db
        .select({ value: countDistinct(manga.malId) })
        .from(manga)
        .leftJoin(mangaGenre, eq(mangaGenre.mangaId, manga.malId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)

      return result[0]?.value ?? 0
    } catch (error) {
      throw dbError('[COUNT_MANGA_LIST]', {}, error)
    }
  },
}
