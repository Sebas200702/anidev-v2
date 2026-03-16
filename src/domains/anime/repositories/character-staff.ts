import { db } from '@/core/db/client'
import { characterVoiceActor } from '@/core/db/schemas/character-relations'
import { staff } from '@/core/db/schemas/staff'
import { inArray } from 'drizzle-orm'
import { dbError } from '@/core/errors/db-errors'
import type { CharacterVoiceActorDB } from '../types/anime-db'
import { dbConfig } from '@/core/db/config'

export const characterStaffRepository = {
  async getVoicesByCharacterIds(characterIds: number[]) {
    try {
      if (!characterIds.length) return []

      const results: CharacterVoiceActorDB[] = []

      for (let i = 0; i < characterIds.length; i += dbConfig.chunkSize) {
        const chunk = characterIds.slice(i, i + dbConfig.chunkSize)

        const rows = await db
          .select()
          .from(characterVoiceActor)
          .where(inArray(characterVoiceActor.characterId, chunk))

        results.push(...rows)
      }

      return results
    } catch (error) {
      throw dbError('[GET_VOICES_BY_CHARACTER_IDS]', { characterIds }, error)
    }
  },
}
