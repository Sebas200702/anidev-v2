/**
 * Data access for the printed-media (manga) detail query.
 *
 * @module domains/manga/repositories/manga-details/repository
 */
import { db } from '@db/client'
import { manga } from '@db/schemas/manga'
import { mangaExternalLink } from '@db/schemas/external-link'
import {
  mangaCharacter,
  mangaDemographic,
  mangaGenre,
  mangaProducer,
  mangaRelation,
  mangaStaff,
  mangaTheme,
} from '@db/schemas/manga-relations'
import {
  demographic as demographicTable,
  genre as genreTable,
  theme as themeTable,
} from '@db/schemas/anime-taxonomy'
import { character } from '@db/schemas/character'
import { staff } from '@db/schemas/staff'
import { producerTitle } from '@db/schemas/producer'
import { dbError } from '@shared/errors/db-errors'
import { and, asc, eq } from 'drizzle-orm'
import type {
  MangaCharacterDB,
  MangaDB,
  MangaDemographicDB,
  MangaExternalLinkDB,
  MangaGenreDB,
  MangaProducerDB,
  MangaRelationsDB,
  MangaStaffDB,
  MangaThemeDB,
} from '@manga/types'

/**
 * Repository that loads a printed work with everything its detail page needs.
 *
 * @remarks
 * The cast and the staff are the **shared** entities of the anime domain, so
 * the join also returns their names; the media (cover) is resolved by the
 * media service, not here.
 */
export const mangaDetailsRepository = {
  /**
   * Loads the work row.
   *
   * @param mangaId - MyAnimeList id of the work
   * @returns The work or `null` when it does not exist
   * @throws {InfraError} On database failure
   */
  async getManga(mangaId: number): Promise<MangaDB | null> {
    try {
      const rows = await db
        .select({ manga })
        .from(manga)
        .where(eq(manga.malId, mangaId))
        .limit(1)
      return rows[0]?.manga ?? null
    } catch (error) {
      throw dbError('[GET_MANGA]', { mangaId }, error)
    }
  },

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

  /** Loads the cast of a work with the character names. */
  async getCharacters(
    mangaId: number
  ): Promise<(MangaCharacterDB & { name: string })[]> {
    try {
      return await db
        .select({
          mangaId: mangaCharacter.mangaId,
          characterId: mangaCharacter.characterId,
          role: mangaCharacter.role,
          name: character.name,
        })
        .from(mangaCharacter)
        .innerJoin(character, eq(character.malId, mangaCharacter.characterId))
        .where(eq(mangaCharacter.mangaId, mangaId))
        .orderBy(asc(mangaCharacter.role), asc(character.name))
    } catch (error) {
      throw dbError('[GET_MANGA_CHARACTERS]', { mangaId }, error)
    }
  },

  /** Loads the staff of a work (authors, artists, editors) with their names. */
  async getStaff(
    mangaId: number
  ): Promise<(MangaStaffDB & { name: string })[]> {
    try {
      return await db
        .select({
          mangaId: mangaStaff.mangaId,
          staffId: mangaStaff.staffId,
          role: mangaStaff.role,
          name: staff.name,
        })
        .from(mangaStaff)
        .innerJoin(staff, eq(staff.malId, mangaStaff.staffId))
        .where(eq(mangaStaff.mangaId, mangaId))
        .orderBy(asc(mangaStaff.role), asc(staff.name))
    } catch (error) {
      throw dbError('[GET_MANGA_STAFF]', { mangaId }, error)
    }
  },

  /** Loads the publishers of a work with the company names. */
  async getPublishers(
    mangaId: number
  ): Promise<(MangaProducerDB & { name: string })[]> {
    try {
      // El nombre de la editorial no está en `producer` (ahí van sus metadatos)
      // sino en `producer_title`: se toma el título por defecto.
      const rows = await db
        .select({
          mangaId: mangaProducer.mangaId,
          producerId: mangaProducer.producerId,
          role: mangaProducer.role,
          name: producerTitle.title,
        })
        .from(mangaProducer)
        .innerJoin(
          producerTitle,
          and(
            eq(producerTitle.producerId, mangaProducer.producerId),
            eq(producerTitle.type, 'Default')
          )
        )
        .where(eq(mangaProducer.mangaId, mangaId))
      return rows.map((row) => ({ ...row, name: row.name ?? '' }))
    } catch (error) {
      throw dbError('[GET_MANGA_PUBLISHERS]', { mangaId }, error)
    }
  },

  /** Loads the related works (id + title + relation type). */
  async getRelated(
    mangaId: number
  ): Promise<(MangaRelationsDB & { title: string })[]> {
    try {
      return await db
        .select({
          mangaId: mangaRelation.mangaId,
          relatedMangaId: mangaRelation.relatedMangaId,
          relationType: mangaRelation.relationType,
          title: manga.title,
        })
        .from(mangaRelation)
        .innerJoin(manga, eq(manga.malId, mangaRelation.relatedMangaId))
        .where(eq(mangaRelation.mangaId, mangaId))
    } catch (error) {
      throw dbError('[GET_MANGA_RELATED]', { mangaId }, error)
    }
  },

  /** Loads the external links of a work. */
  async getExternalLinks(mangaId: number): Promise<MangaExternalLinkDB[]> {
    try {
      return await db
        .select()
        .from(mangaExternalLink)
        .where(eq(mangaExternalLink.mangaId, mangaId))
    } catch (error) {
      throw dbError('[GET_MANGA_EXTERNAL_LINKS]', { mangaId }, error)
    }
  },
}
