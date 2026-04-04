import { db } from '@/core/db/client'
import { staffMedia } from '@/core/db/schemas/staff-media'
import { dbError } from '@/core/errors/db-errors'
import { and, asc, eq } from 'drizzle-orm'
import type { MediaAsset } from '../types/media'

export const staffMediaRepository = {
  async getMediaByEntityAndType({
    mediaType,
    staffId,
  }: {
    mediaType: string
    staffId: number
  }): Promise<MediaAsset[]> {
    try {
      const rows = await db
        .select()
        .from(staffMedia)
        .orderBy(asc(staffMedia.id))
        .where(
          and(
            eq(staffMedia.staffId, staffId),
            eq(staffMedia.mediaType, mediaType)
          )
        )

      return rows.map((row) => ({
        id: row.id,
        mediaType: row.mediaType,
        src: row.src,
        size: row.size,
      }))
    } catch (error) {
      throw dbError(
        '[GET_MEDIA_BY_STAFF_ID_AND_TYPE]',
        { mediaType, staffId },
        error
      )
    }
  },
}