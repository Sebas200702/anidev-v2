import { db } from '@/core/db/client'
import { characterMedia } from '@/core/db/schemas/character-media'
import { dbError } from '@/core/errors/db-errors'
import { and, asc, eq, inArray } from 'drizzle-orm'
import type { MediaAsset } from '../types/media'

export const characterMediaRepository = {
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
  async getMediaByEntityAndType({
    mediaType,
    characterId,
  }: {
    mediaType: string
    characterId: number
  }): Promise<MediaAsset[]> {
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
