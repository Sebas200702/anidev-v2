import { db } from '@/core/db/client'
import { character } from '@/core/db/schemas/character'
import { eq, inArray } from 'drizzle-orm'
import type { CharacterDB } from '@/domains/anime/types/anime-db'
import { dbError } from '@/core/errors/db-errors'
export const characterRepository = {
  async getByMalId(malId: number): Promise<CharacterDB | undefined> {
    try {
      const [result] = await db
        .select()
        .from(character)
        .where(eq(character.malId, malId))
      return result
    } catch (error) {
      throw dbError('[GET_BY_MAL_ID]', { malId }, error)
    }
  },

  async getManyByMalIds(malIds: number[]): Promise<CharacterDB[]> {
    try {
      if (!malIds.length) return []
      return db.select().from(character).where(inArray(character.malId, malIds))
    } catch (error) {
      throw dbError('[GET_MANY_BY_MAL_IDS]', { malIds }, error)
    }
  },
}
