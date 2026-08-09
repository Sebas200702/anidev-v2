import { db } from '@db/client'
import { musicResolution, musicVersion } from '@db/schemas/music'
import type { MediaAsset } from '@media/types/media-types'
import { dbError } from '@shared/errors/db-errors'
import { asc, eq } from 'drizzle-orm'
import type { GetMusicMediaByTypeParams, MusicMediaAsset } from './types'

export const musicMediaRepository = {
  async getMediaByEntityAndType({
    mediaType,
    musicId,
    version,
    resolution,
  }: GetMusicMediaByTypeParams): Promise<MediaAsset[]> {
    try {
      const rows = await db
        .select({
          id: musicResolution.id,
          resolution: musicResolution.resolution,
          audioUrl: musicResolution.audioUrl,
          videoUrl: musicResolution.videoUrl,
          dbVersion: musicVersion.version,
        })
        .from(musicVersion)
        .innerJoin(
          musicResolution,
          eq(musicResolution.musicVersionId, musicVersion.versionId)
        )
        .where(eq(musicVersion.musicId, musicId))
        .orderBy(asc(musicVersion.version), asc(musicResolution.id))

      const srcKey = mediaType === 'video' ? 'videoUrl' : 'audioUrl'

      return rows
        .filter((row) => !version || String(row.dbVersion) === String(version))
        .filter((row) => !resolution || row.resolution.startsWith(resolution))
        .map((row) => {
          const src = row[srcKey]
          if (!src) return null
          return { id: row.id, mediaType, src, size: row.resolution }
        })
        .filter((asset): asset is MusicMediaAsset => asset !== null)
    } catch (error) {
      throw dbError(
        '[GET_MEDIA_BY_MUSIC_ID_AND_TYPE]',
        { mediaType, musicId, version, resolution },
        error
      )
    }
  },
}
