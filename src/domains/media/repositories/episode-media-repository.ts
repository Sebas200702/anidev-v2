import { db } from '@db/client'
import { episodeSource } from '@db/schemas/episode'
import { dbError } from '@shared/errors/db-errors'
import type { MediaAsset } from '@domains/media/types/media-types'
import { asc, eq } from 'drizzle-orm'

type GetEpisodeMediaByTypeParams = {
  mediaType: string
  episodeId: number
}

export const episodeMediaRepository = {
  async getMediaByEntityAndType({
    mediaType,
    episodeId,
  }: GetEpisodeMediaByTypeParams): Promise<MediaAsset[]> {
    try {
      const rows = await db
        .select()
        .from(episodeSource)
        .where(eq(episodeSource.episodeId, episodeId))
        .orderBy(asc(episodeSource.id))

      return rows.map((row) => ({
        id: row.id,
        mediaType,
        src: row.src,
        size: null,
      }))
    } catch (error) {
      throw dbError(
        '[GET_MEDIA_BY_EPISODE_ID_AND_TYPE]',
        { mediaType, episodeId },
        error
      )
    }
  },
}
