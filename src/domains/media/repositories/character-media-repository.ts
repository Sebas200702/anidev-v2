/**
 * @module @domains/media/repositories/character-media-repository
 * @remarks Database access for character media assets stored in the `characterMedia` table.
 */
import { db } from '@db/client'
import { characterMedia } from '@db/schemas/character-media'
import { dbError } from '@shared/errors/db-errors'
import { and, asc, eq, inArray } from 'drizzle-orm'
import type { MediaAsset } from '@domains/media/types/media-types'

/** Parameters for filtering character media by entity ID and media type. */
type GetCharacterMediaByTypeParams = {
  mediaType: string
  characterId: number
}

/**
 * Reads media assets linked to character records.
 *
 * @remarks Queries return {@link MediaAsset} rows used by {@link resolveMediaAssets} when
 * resolving semantic paths for {@link MediaEntity.CHARACTER}.
 * @see {@link mediaService.resolveMedia} for downstream filtering and selection
 * @example
 * ```typescript
 * const icons = await characterMediaRepository.getMediaByEntityAndType({
 *   characterId: 100,
 *   mediaType: 'icon',
 * })
 * ```
 */
export const characterMediaRepository = {
  /**
   * Loads media assets for multiple character IDs.
   *
   * @remarks Returns an empty array immediately when `characterIds` is empty.
   * @param characterIds - Internal character identifiers
   * @returns {@link MediaAsset} rows for the requested characters
   * @throws {DbError} When the database query fails
   * @see {@link characterMediaRepository.getMediaByEntityAndType} for typed single-entity lookup
   * @example
   * ```typescript
   * const media = await characterMediaRepository.getMediaByCharacterIds([1, 2, 3])
   * ```
   */
  async getMediaByCharacterIds(characterIds: number[]): Promise<MediaAsset[]> {
    if (!characterIds.length) return []

    try {
      return await db
        .select()
        .from(characterMedia)
        .where(inArray(characterMedia.characterId, characterIds))
    } catch (error) {
      throw dbError('[GET_MEDIA_BY_CHARACTER_IDS]', { characterIds }, error)
    }
  },

  /**
   * Loads media assets for a character filtered by media type.
   *
   * @remarks Results are ordered ascending by `id` for deterministic index selection.
   * @param params - Character ID and media type filter
   * @returns Matching {@link MediaAsset} rows ordered by ID
   * @throws {DbError} When the database query fails
   * @see {@link mapIndexedMediaAsset} for 1-based asset selection
   * @example
   * ```typescript
   * const posters = await characterMediaRepository.getMediaByEntityAndType({
   *   characterId: 100,
   *   mediaType: 'poster',
   * })
   * ```
   */
  async getMediaByEntityAndType({
    mediaType,
    characterId,
  }: GetCharacterMediaByTypeParams): Promise<MediaAsset[]> {
    try {
      return await db
        .select()
        .from(characterMedia)
        .orderBy(asc(characterMedia.id))
        .where(
          and(
            eq(characterMedia.characterId, characterId),
            eq(characterMedia.mediaType, mediaType)
          )
        )
    } catch (error) {
      throw dbError(
        '[GET_MEDIA_BY_CHARACTER_ID_AND_TYPE]',
        { mediaType, characterId },
        error
      )
    }
  },
}
