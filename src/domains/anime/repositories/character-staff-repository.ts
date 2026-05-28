/**
 * Data access for character voice actor join records.
 *
 * @module domains/anime/repositories/character-staff-repository
 */
import { db } from '@db/client'
import { dbConfig } from '@db/config'
import { characterVoiceActor } from '@db/schemas/character-relations'
import { dbError } from '@shared/errors/db-errors'
import { inArray } from 'drizzle-orm'
import type { CharacterVoiceActorDB } from '@domains/anime/types'

/**
 * Repository for querying voice actor credits linked to characters.
 *
 * @remarks
 * **Table:** `character_voice_actor` (`character_id`, `staff_id`, `language`)
 *
 * **SQL:** Chunked `IN` queries (`dbConfig.chunkSize`) to avoid parameter limits.
 *
 * **Empty vs null:** `[]` for empty `characterIds` or no voice rows.
 *
 * @see {@link animeCharacterService}
 * @see {@link mapAnimeCharacters}
 */
export const characterStaffRepository = {
  /**
   * Loads voice actor relations for the given character IDs.
   *
   * @param characterIds - Character MAL IDs
   * @returns {@link CharacterVoiceActorDB} rows across all chunks
   *
   * @throws {InfraError} (`[GET_VOICES_BY_CHARACTER_IDS]`)
   *
   * @example
   * ```typescript
   * const voices = await characterStaffRepository.getVoicesByCharacterIds([1, 2, 3])
   * ```
   */
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
