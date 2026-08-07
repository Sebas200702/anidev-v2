/**
 * Application service for anime character data.
 *
 * @module domains/anime/services/anime-characters-service
 */
import { animeCharacterRepository } from '@anime/repositories/anime-characters-repository'
import { characterRepository } from '@anime/repositories/character-repository'
import { characterStaffRepository } from '@anime/repositories/character-staff-repository'
import { animeCharacterCache } from '@anime/cache/anime-character-cache'
import { staffRepository } from '@anime/repositories/staff-repository'
import { mapAnimeCharacters } from '@anime/mappers/anime-character-mapper'
import { withCache } from '@lib/cache'
import type { AnimeCharacter } from '@anime/types'

/**
 * Coordinates repository access, mapping, and caching for anime characters.
 *
 * @remarks
 * **Pipeline:** `anime:characters:{animeId}` → join refs → characters + voice
 * relations (parallel) → staff by voice IDs → `mapAnimeCharacters`
 *
 * **Cache TTL:** {@link CacheTtl.Long} (86400 s)
 *
 * @see {@link animeCharacterCache}
 * @see {@link mapAnimeCharacters}
 */
export const animeCharacterService = {
  /**
   * Loads characters and voice actors for an anime, using cache when available.
   *
   * @param animeId - Parent anime MAL ID
   * @returns {@link AnimeCharacter}[] ordered by join table iteration
   *
   * @throws {Error} From mapper if a join references a missing character row
   * @throws {InfraError} On repository failures
   *
   * @example
   * ```typescript
   * const cast = await animeCharacterService.getAnimeCharacters(5114)
   * ```
   */
  async getAnimeCharacters(animeId: number): Promise<AnimeCharacter[]> {
    return withCache({
      key: animeCharacterCache.key(animeId),
      getCache: () => animeCharacterCache.get(animeId),
      setCache: (_, value) => animeCharacterCache.set(animeId, value),
      compute: async () => {
        const refs =
          await animeCharacterRepository.getCharacterRefsByAnimeId(animeId)

        const characterIds = refs.map((r) => r.characterId)

        const [characters, voiceRelations] = await Promise.all([
          characterRepository.getManyByMalIds(characterIds),
          characterStaffRepository.getVoicesByCharacterIds(characterIds),
        ])

        const staffIds = [...new Set(voiceRelations.map((v) => v.staffId))]

        const staff = await staffRepository.getManyByMalIds(staffIds)

        return mapAnimeCharacters({
          refs,
          characters,
          voiceRelations,
          staff,
        })
      },
    })
  },
}
