import type { AnimeMediaDB } from '@/domains/anime/types/anime-db'
import { animeMedia } from '@/core/db/schemas/anime-media'
import { db } from '@/core/db/client'
import { eq, inArray } from 'drizzle-orm'
import { dbError } from '@/core/errors/db-errors'

export const animeMediaRepository = {
  async getMediaByAnimeId(animeId: number): Promise<AnimeMediaDB[]> {
    try {
      return await db
        .select()
        .from(animeMedia)
        .where(eq(animeMedia.animeId, animeId))
    } catch (error) {
      throw dbError('[GET_MEDIA_BY_ANIME_ID]', { animeId }, error)
    }
  },
  async getMediaByAnimeIds(animeIds: number[]): Promise<AnimeMediaDB[]> {
    try {
      return await db
        .select()
        .from(animeMedia)
        .where(inArray(animeMedia.animeId, animeIds))
    } catch (error) {
      throw dbError('[GET_MEDIA_BY_ANIME_IDS]', { animeIds }, error)
    }
  },
}
