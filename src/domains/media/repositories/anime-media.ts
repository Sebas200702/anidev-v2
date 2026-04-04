import { db } from '@/core/db/client'
import { animeMedia } from '@/core/db/schemas/anime-media'
import { dbError } from '@/core/errors/db-errors'

import type { MediaAsset } from '@/domains/media/types/media'
import { and, asc, eq, inArray } from 'drizzle-orm'

export const animeMediaRepository = {
  async getMediaByAnimeId(animeId: number): Promise<MediaAsset[]> {
    try {
      return await db
        .select()
        .from(animeMedia)
        .where(eq(animeMedia.animeId, animeId))
    } catch (error) {
      throw dbError('[GET_MEDIA_BY_ANIME_ID]', { animeId }, error)
    }
  },
  async getMediaByAnimeIds(animeIds: number[]): Promise<MediaAsset[]> {
    try {
      return await db
        .select()
        .from(animeMedia)
        .where(inArray(animeMedia.animeId, animeIds))
    } catch (error) {
      throw dbError('[GET_MEDIA_BY_ANIME_IDS]', { animeIds }, error)
    }
  },
  async getMediaByEntityAndType({
    mediaType,
    animeId,
  }: {
    mediaType: string
    animeId: number
  }): Promise<MediaAsset[]> {
    try {
      return await db
        .select()
        .from(animeMedia)
        .orderBy(asc(animeMedia.id))
        .where(
          and(
            eq(animeMedia.animeId, animeId),
            eq(animeMedia.mediaType, mediaType)
          )
        )
    } catch (error) {
      throw dbError(
        '[GET_MEDIA_BY_ANIME_ID_AND_TYPE]',
        { mediaType, animeId },
        error
      )
    }
  },
}
