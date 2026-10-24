/**
 * SQL filter builders for paginated printed-media (manga) list queries.
 *
 * @module domains/manga/repositories/manga-list/filters
 */
import { db } from '@db/client'
import { manga, mangaTitleSynonym } from '@db/schemas/manga'
import {
  mangaGenre,
  mangaTheme,
  mangaDemographic,
} from '@db/schemas/manga-relations'
import {
  demographic as demographicTable,
  genre as genreTable,
  theme as themeTable,
} from '@db/schemas/anime-taxonomy'
import { ADULT_MANGA_GENRES } from '@manga/constants'
import {
  eq,
  ilike,
  inArray,
  notInArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'
import type { MangaFilters } from '@manga/types'

/**
 * Builds SQL filter clauses for manga list queries.
 *
 * @param filters - Normalized {@link MangaFilters} (minus pagination is fine; pagination ignored)
 * @returns Array of Drizzle `SQL` fragments combined with `AND`
 */
export const buildMangaListConditions = (
  filters: Omit<MangaFilters, 'page' | 'limit'>
): SQL[] => {
  const conditions: SQL[] = []

  // Parental floor: exclude adult genres unless explicitly `full`. Fail-closed —
  // an unset variant is treated as `safe`. Works with no genre rows are kept.
  if (filters.parentalVariant !== 'full') {
    conditions.push(
      notInArray(
        manga.malId,
        db
          .select({ id: mangaGenre.mangaId })
          .from(mangaGenre)
          .innerJoin(genreTable, eq(genreTable.malId, mangaGenre.genreId))
          .where(inArray(genreTable.name, [...ADULT_MANGA_GENRES]))
      )
    )
  }

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
      ) as SQL
    )
  }

  return conditions
}
