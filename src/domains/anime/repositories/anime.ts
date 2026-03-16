import { db } from '@/core/db/client'
import { anime } from '@/core/db/schemas/anime'
import { eq, inArray } from 'drizzle-orm'
import { dbError } from '@/core/errors/db-errors'
import type { AnimeDB } from '@/domains/anime/types/anime-db'

export const animeRepository = {
  async getAnimeByMalId(malId: number): Promise<AnimeDB | undefined> {
    try {
      const [result] = await db
        .select()
        .from(anime)
        .where(eq(anime.malId, malId))
      return result
    } catch (error) {
      throw dbError('[GET_ANIME_BY_MAL_ID]', { malId }, error)
    }
  },
  async getManyAnimeByMalIds(malIds: number[]): Promise<AnimeDB[]> {
    try {
      return await db
        .select()
        .from(anime)
        .where(inArray(anime.malId, malIds))
    } catch (error) {
      throw dbError('[GET_MANY_ANIME_BY_MAL_IDS]', { malIds }, error)
    }
  },
}
