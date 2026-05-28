/**
 * @module @domains/media/repositories/staff-media-repository
 * @remarks Database access for staff media assets stored in the `staffMedia` table.
 */
import { db } from '@db/client'
import { staffMedia } from '@db/schemas/staff-media'
import { dbError } from '@shared/errors/db-errors'
import { and, asc, eq } from 'drizzle-orm'
import type { MediaAsset } from '@domains/media/types/media-types'

/** Parameters for filtering staff media by entity ID and media type. */
type GetStaffMediaByTypeParams = {
  mediaType: string
  staffId: number
}

/**
 * Reads media assets linked to staff records.
 *
 * @remarks Maps selected rows into the shared {@link MediaAsset} shape (`id`, `mediaType`,
 * `src`, `size`) for consistency with other entity repositories.
 * @see {@link mediaService.resolveMedia} for semantic path resolution
 * @example
 * ```typescript
 * const icons = await staffMediaRepository.getMediaByEntityAndType({
 *   staffId: 50,
 *   mediaType: 'icon',
 * })
 * ```
 */
export const staffMediaRepository = {
  /**
   * Loads media assets for a staff member filtered by media type.
   *
   * @remarks Results are ordered ascending by `id`. Row fields are projected into the
   * {@link MediaAsset} interface before returning.
   * @param params - Staff ID and media type filter
   * @returns Matching {@link MediaAsset} rows ordered by ID
   * @throws {DbError} When the database query fails
   * @see {@link mapFilteredMediaAssets} for size/source filtering after load
   * @example
   * ```typescript
   * const assets = await staffMediaRepository.getMediaByEntityAndType({
   *   staffId: 50,
   *   mediaType: 'icon',
   * })
   * ```
   */
  async getMediaByEntityAndType({
    mediaType,
    staffId,
  }: GetStaffMediaByTypeParams): Promise<MediaAsset[]> {
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
