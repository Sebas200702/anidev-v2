import { db } from '@db/client'
import { episodeSource } from '@db/schemas/episode'
import { episodeMedia } from '@db/schemas/episode-media'
import { dbError } from '@shared/errors/db-errors'
import type { MediaAsset } from '@media/types/media-types'
import { and, asc, eq } from 'drizzle-orm'
import type { GetEpisodeMediaByTypeParams } from './types'

/**
 * Loads media assets for an episode.
 *
 * @remarks
 * `episode_media` holds image assets per media type (thumbnails come from the
 * ingestion pipeline under `EPISODE_THUMBNAIL_MEDIA_TYPE`), ordered by
 * `priority` then `id` so the preferred variant wins.
 *
 * `episode_source` holds **streamed** sources (video/subtitles) and has no
 * media type, so it stays as the fallback for types that are not present in
 * `episode_media`: the raw-stream path keeps working while thumbnails resolve
 * from the right table.
 *
 * @param params - Episode id and requested media type
 * @returns Matching assets, or `[]` when the episode has none
 * @throws {DbError} When the database query fails
 */
export const episodeMediaRepository = {
  async getMediaByEntityAndType({
    mediaType,
    episodeId,
  }: GetEpisodeMediaByTypeParams): Promise<MediaAsset[]> {
    try {
      const rows = await db
        .select()
        .from(episodeMedia)
        .where(
          and(
            eq(episodeMedia.episodeId, episodeId),
            eq(episodeMedia.mediaType, mediaType)
          )
        )
        .orderBy(asc(episodeMedia.priority), asc(episodeMedia.id))

      if (rows.length > 0) {
        return rows.map((row) => ({
          id: row.id,
          mediaType: row.mediaType,
          src: row.src,
          size: row.size,
        }))
      }

      // Fallback: fuentes en streaming (vídeo/subtítulos) viven en episode_source.
      const sources = await db
        .select()
        .from(episodeSource)
        .where(eq(episodeSource.episodeId, episodeId))
        .orderBy(asc(episodeSource.id))

      return sources.map((row) => ({
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
