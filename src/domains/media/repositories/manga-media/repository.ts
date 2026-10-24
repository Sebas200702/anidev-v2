/**
 * @module domains/media/repositories/manga-media/repository
 * @remarks Database access for printed-media assets stored in the `mangaMedia` table.
 */
import { db } from '@db/client'
import { mangaMedia } from '@db/schemas/manga-media'
import { dbError } from '@shared/errors/db-errors'
import type { MediaAsset } from '@media/types/media-types'
import { asc, eq } from 'drizzle-orm'

/**
 * Reads media assets linked to printed-media (manga) records.
 *
 * @remarks All queries return {@link MediaAsset} rows consumed by
 * {@link resolveMediaAssets} during semantic path resolution. Failures are
 * wrapped in {@link dbError}.
 */
export const mangaMediaRepository = {
  /**
   * Loads the media assets of a work.
   *
   * @param mangaId - MyAnimeList id of the work
   * @returns All {@link MediaAsset} rows for the work
   * @throws {DbError} When the database query fails
   */
  async getMediaByMangaId(mangaId: number): Promise<MediaAsset[]> {
    try {
      return await db
        .select()
        .from(mangaMedia)
        .where(eq(mangaMedia.mangaId, mangaId))
        // `priority` manda: la variante preferida queda primero.
        .orderBy(asc(mangaMedia.priority), asc(mangaMedia.id))
    } catch (error) {
      throw dbError('[GET_MEDIA_BY_MANGA_ID]', { mangaId }, error)
    }
  },

  /**
   * Loads the media assets of a work filtered by type.
   *
   * @param mangaId - MyAnimeList id of the work
   * @param mediaType - Asset category (`cover`, `banner`, …)
   * @returns The matching {@link MediaAsset} rows
   * @throws {DbError} When the database query fails
   */
  async getMediaByEntityAndType({
    mangaId,
    mediaType,
  }: {
    mangaId: number
    mediaType: string
  }): Promise<MediaAsset[]> {
    try {
      return await db
        .select()
        .from(mangaMedia)
        .where(eq(mangaMedia.mangaId, mangaId))
        .orderBy(asc(mangaMedia.priority), asc(mangaMedia.id))
        .then((rows) => rows.filter((row) => row.mediaType === mediaType))
    } catch (error) {
      throw dbError('[GET_MANGA_MEDIA_BY_TYPE]', { mangaId, mediaType }, error)
    }
  },
}
