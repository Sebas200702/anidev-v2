/**
 * Data access for the printed-media (manga) list queries.
 *
 * @module domains/manga/repositories/manga-list/repository
 */
import { db } from '@db/client'
import { manga } from '@db/schemas/manga'
import { mangaGenre } from '@db/schemas/manga-relations'
import { genre as genreTable } from '@db/schemas/anime-taxonomy'
import { dbError } from '@shared/errors/db-errors'
import { and, countDistinct, eq } from 'drizzle-orm'
import type { MangaDB, MangaFilters } from '@manga/types'
import { buildMangaListConditions } from './filters'
import { buildMangaListSort } from './sort'

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
      const conditions = buildMangaListConditions(filters)

      const rows = await db
        .selectDistinct({ manga })
        .from(manga)
        .leftJoin(mangaGenre, eq(mangaGenre.mangaId, manga.malId))
        .leftJoin(genreTable, eq(genreTable.malId, mangaGenre.genreId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(...buildMangaListSort(filters))
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
      const conditions = buildMangaListConditions(filters)

      const result = await db
        .select({ value: countDistinct(manga.malId) })
        .from(manga)
        .where(conditions.length > 0 ? and(...conditions) : undefined)

      return result[0]?.value ?? 0
    } catch (error) {
      throw dbError('[COUNT_MANGA_LIST]', {}, error)
    }
  },
}
