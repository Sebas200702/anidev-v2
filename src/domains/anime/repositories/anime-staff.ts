import { animeStaff } from '@/core/db/schemas/anime-relations'
import { db } from '@/core/db/client'
import { eq } from 'drizzle-orm'
import type { AnimeStaffDB } from '@/domains/anime/types/anime-db'
import { dbError } from '@/core/errors/db-errors'

export const animeStaffRepository = {
  async getAnimeStaffByAnimeMalId(malId: number): Promise<AnimeStaffDB[]> {
    try {
    return await db
      .select()
      .from(animeStaff)
      .where(eq(animeStaff.animeId, malId))
    } catch (error) {
      throw dbError('[GET_ANIME_STAFF_BY_ANIME_MAL_ID]', { malId }, error)
    }
  },
}
